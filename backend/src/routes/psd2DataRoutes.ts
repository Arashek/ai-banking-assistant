import express from 'express';
import { Request, Response } from 'express';
import psd2Service from '../services/psd2Service';
import { rateLimit } from 'express-rate-limit';
import { createLogger } from '../utils/logger';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';

const router = express.Router();
const logger = createLogger('psd2-data');

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});

router.use(limiter);

// Middleware to prepare request options
const prepareRequestOptions = (req: Request) => ({
  userId: req.user?.id,
  userIp: req.ip,
  userAgent: req.get('user-agent') || '',
});

// Sync all accounts
router.post('/sync/accounts', async (req: Request, res: Response) => {
  try {
    const options = prepareRequestOptions(req);
    logger.info('Starting account synchronization', { userId: options.userId });

    const accounts = await psd2Service.getAccounts(options);
    
    // Process each account
    for (const accountData of accounts) {
      await Account.findOneAndUpdate(
        { accountId: accountData.id },
        {
          $set: {
            accountNumber: accountData.iban,
            balance: accountData.balances[0]?.amount,
            currency: accountData.currency,
            status: accountData.status,
            lastSynced: new Date(),
          },
        },
        { upsert: true, new: true }
      );
    }

    logger.info('Account synchronization completed', {
      userId: options.userId,
      accountCount: accounts.length,
    });

    res.json({ message: 'Accounts synchronized successfully', count: accounts.length });
  } catch (error) {
    logger.error('Account synchronization failed', {
      userId: req.user?.id,
      error: error.message,
    });
    res.status(500).json({ message: 'Failed to synchronize accounts' });
  }
});

// Sync transactions for a specific account
router.post('/sync/transactions/:accountId', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { dateFrom, dateTo } = req.query;
    const options = prepareRequestOptions(req);

    logger.info('Starting transaction synchronization', {
      userId: options.userId,
      accountId,
      dateFrom,
      dateTo,
    });

    const transactions = await psd2Service.getAccountTransactions(
      options,
      accountId,
      dateFrom as string,
      dateTo as string
    );

    // Process each transaction
    for (const transactionData of transactions) {
      await Transaction.findOneAndUpdate(
        { transactionId: transactionData.id },
        {
          $set: {
            accountId,
            type: transactionData.creditDebitIndicator === 'CRDT' ? 'credit' : 'debit',
            amount: transactionData.amount,
            currency: transactionData.currency,
            description: transactionData.remittanceInformation,
            category: transactionData.category || 'uncategorized',
            status: transactionData.status,
            valueDate: transactionData.valueDate,
            bookingDate: transactionData.bookingDate,
            lastSynced: new Date(),
          },
        },
        { upsert: true, new: true }
      );
    }

    logger.info('Transaction synchronization completed', {
      userId: options.userId,
      accountId,
      transactionCount: transactions.length,
    });

    res.json({
      message: 'Transactions synchronized successfully',
      count: transactions.length,
    });
  } catch (error) {
    logger.error('Transaction synchronization failed', {
      userId: req.user?.id,
      accountId: req.params.accountId,
      error: error.message,
    });
    res.status(500).json({ message: 'Failed to synchronize transactions' });
  }
});

// Sync balances for a specific account
router.post('/sync/balances/:accountId', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const options = prepareRequestOptions(req);

    logger.info('Starting balance synchronization', {
      userId: options.userId,
      accountId,
    });

    const balances = await psd2Service.getAccountBalances(options, accountId);
    
    await Account.findOneAndUpdate(
      { accountId },
      {
        $set: {
          balance: balances[0]?.amount,
          availableBalance: balances[0]?.amount,
          currency: balances[0]?.currency,
          lastBalanceUpdate: new Date(),
        },
      }
    );

    logger.info('Balance synchronization completed', {
      userId: options.userId,
      accountId,
    });

    res.json({ message: 'Balance synchronized successfully' });
  } catch (error) {
    logger.error('Balance synchronization failed', {
      userId: req.user?.id,
      accountId: req.params.accountId,
      error: error.message,
    });
    res.status(500).json({ message: 'Failed to synchronize balance' });
  }
});

// Check funds availability
router.post('/check-funds', async (req: Request, res: Response) => {
  try {
    const { accountId, amount, currency } = req.body;
    const options = prepareRequestOptions(req);

    if (!accountId || !amount || !currency) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    logger.info('Checking funds availability', {
      userId: options.userId,
      accountId,
      amount,
      currency,
    });

    const result = await psd2Service.checkFundsAvailability(
      options,
      accountId,
      amount,
      currency
    );

    logger.info('Funds check completed', {
      userId: options.userId,
      accountId,
      result,
    });

    res.json(result);
  } catch (error) {
    logger.error('Funds check failed', {
      userId: req.user?.id,
      accountId: req.body.accountId,
      error: error.message,
    });
    res.status(500).json({ message: 'Failed to check funds availability' });
  }
});

export default router;
