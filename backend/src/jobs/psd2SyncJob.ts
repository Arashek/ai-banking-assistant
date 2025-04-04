import cron from 'node-cron';
import { createLogger } from '../utils/logger';
import psd2Service from '../services/psd2Service';
import { User } from '../models/User';
import tokenStorage from '../services/tokenStorage';

const logger = createLogger('psd2-sync-job');

interface SyncStats {
  accountsUpdated: number;
  transactionsUpdated: number;
  errors: number;
}

class PSD2SyncJob {
  private static instance: PSD2SyncJob;
  private isRunning: boolean = false;

  private constructor() {
    // Schedule daily sync at 2 AM
    cron.schedule('0 2 * * *', () => {
      this.runSync();
    });

    // Schedule balance updates every hour
    cron.schedule('0 * * * *', () => {
      this.updateBalances();
    });
  }

  public static getInstance(): PSD2SyncJob {
    if (!PSD2SyncJob.instance) {
      PSD2SyncJob.instance = new PSD2SyncJob();
    }
    return PSD2SyncJob.instance;
  }

  private async runSync(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Sync job is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting PSD2 sync job');

    try {
      const users = await User.find({ 'psd2Access.enabled': true });
      logger.info(`Found ${users.length} users with PSD2 access`);

      const stats: SyncStats = {
        accountsUpdated: 0,
        transactionsUpdated: 0,
        errors: 0,
      };

      for (const user of users) {
        try {
          await this.syncUserData(user.id, stats);
        } catch (error) {
          logger.error('Error syncing user data', {
            userId: user.id,
            error: error.message,
          });
          stats.errors++;
        }
      }

      logger.info('PSD2 sync job completed', { stats });
    } catch (error) {
      logger.error('PSD2 sync job failed', { error: error.message });
    } finally {
      this.isRunning = false;
    }
  }

  private async updateBalances(): Promise<void> {
    logger.info('Starting balance update job');

    try {
      const users = await User.find({ 'psd2Access.enabled': true });
      let updatedCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          const accounts = await psd2Service.getAccounts({
            userId: user.id,
            userIp: '127.0.0.1',
            userAgent: 'PSD2SyncJob/1.0',
          });

          for (const account of accounts) {
            await psd2Service.getAccountBalances({
              userId: user.id,
              userIp: '127.0.0.1',
              userAgent: 'PSD2SyncJob/1.0',
            }, account.id);
            updatedCount++;
          }
        } catch (error) {
          logger.error('Error updating balances', {
            userId: user.id,
            error: error.message,
          });
          errorCount++;
        }
      }

      logger.info('Balance update job completed', {
        updatedCount,
        errorCount,
      });
    } catch (error) {
      logger.error('Balance update job failed', { error: error.message });
    }
  }

  private async syncUserData(userId: string, stats: SyncStats): Promise<void> {
    const options = {
      userId,
      userIp: '127.0.0.1',
      userAgent: 'PSD2SyncJob/1.0',
    };

    // Check consent validity
    const consentData = await tokenStorage.getConsentData(userId);
    if (!consentData) {
      logger.warn('No consent data found for user', { userId });
      return;
    }

    const consentStatus = await psd2Service.getConsentStatus(options, consentData.consentId);
    if (consentStatus.status !== 'valid') {
      logger.warn('Invalid consent status', {
        userId,
        status: consentStatus.status,
      });
      return;
    }

    // Sync accounts
    const accounts = await psd2Service.getAccounts(options);
    stats.accountsUpdated += accounts.length;

    // Get transactions for each account
    for (const account of accounts) {
      try {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const transactions = await psd2Service.getAccountTransactions(
          options,
          account.id,
          thirtyDaysAgo.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );

        stats.transactionsUpdated += transactions.length;
      } catch (error) {
        logger.error('Error syncing transactions', {
          userId,
          accountId: account.id,
          error: error.message,
        });
        stats.errors++;
      }
    }
  }

  // Manual sync trigger for testing or on-demand sync
  public async triggerSync(): Promise<void> {
    await this.runSync();
  }
}

export default PSD2SyncJob.getInstance();
