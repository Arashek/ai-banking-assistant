const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

class BankingService {
  // Create a new account
  async createAccount(userId, accountType, initialBalance = 0) {
    try {
      const accountNumber = this.generateAccountNumber();
      const account = new Account({
        userId,
        accountType,
        accountNumber,
        balance: initialBalance,
      });
      await account.save();
      return account;
    } catch (error) {
      throw new Error(`Error creating account: ${error.message}`);
    }
  }

  // Get account balance
  async getBalance(accountId) {
    try {
      const account = await Account.findById(accountId);
      if (!account) {
        throw new Error('Account not found');
      }
      return account.balance;
    } catch (error) {
      throw new Error(`Error getting balance: ${error.message}`);
    }
  }

  // Transfer money between accounts
  async transfer(fromAccountId, toAccountId, amount, description = '') {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const fromAccount = await Account.findById(fromAccountId).session(session);
      const toAccount = await Account.findById(toAccountId).session(session);

      if (!fromAccount || !toAccount) {
        throw new Error('One or both accounts not found');
      }

      if (fromAccount.balance < amount) {
        throw new Error('Insufficient funds');
      }

      // Create transaction record
      const transaction = new Transaction({
        fromAccount: fromAccountId,
        toAccount: toAccountId,
        amount,
        type: 'transfer',
        description,
        status: 'pending'
      });

      // Update account balances
      fromAccount.balance -= amount;
      toAccount.balance += amount;

      // Save changes
      await fromAccount.save();
      await toAccount.save();
      await transaction.save();

      // Update transaction status
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      await transaction.save();

      await session.commitTransaction();
      return transaction;
    } catch (error) {
      await session.abortTransaction();
      throw new Error(`Transfer failed: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  // Get transaction history
  async getTransactionHistory(accountId, limit = 10) {
    try {
      const transactions = await Transaction.getUserTransactions([accountId], limit);
      return transactions;
    } catch (error) {
      throw new Error(`Error getting transaction history: ${error.message}`);
    }
  }

  // Get spending analysis
  async getSpendingAnalysis(accountId, startDate, endDate) {
    try {
      const analysis = await Transaction.getSpendingByCategory(accountId, startDate, endDate);
      return analysis;
    } catch (error) {
      throw new Error(`Error getting spending analysis: ${error.message}`);
    }
  }

  // Generate a unique account number
  generateAccountNumber() {
    const prefix = 'BA'; // Banking Assistant
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  // Schedule a future payment
  async schedulePayment(fromAccountId, toAccountId, amount, scheduledDate, description = '') {
    try {
      const scheduledPayment = new Transaction({
        fromAccount: fromAccountId,
        toAccount: toAccountId,
        amount,
        type: 'payment',
        status: 'pending',
        description,
        metadata: {
          scheduledDate
        }
      });
      await scheduledPayment.save();
      return scheduledPayment;
    } catch (error) {
      throw new Error(`Error scheduling payment: ${error.message}`);
    }
  }

  // Set up spending alert
  async setSpendingAlert(accountId, threshold, category = null) {
    try {
      const account = await Account.findById(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      // Add alert to account settings
      if (!account.alerts) {
        account.alerts = [];
      }
      
      account.alerts.push({
        type: 'spending',
        threshold,
        category,
        isActive: true
      });

      await account.save();
      return account.alerts;
    } catch (error) {
      throw new Error(`Error setting spending alert: ${error.message}`);
    }
  }
}

module.exports = new BankingService();
