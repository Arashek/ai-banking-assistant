const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'EUR'
  },
  type: {
    type: String,
    enum: ['transfer', 'payment', 'deposit', 'withdrawal'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'food',
      'transport',
      'utilities',
      'entertainment',
      'shopping',
      'healthcare',
      'transfer',
      'other'
    ],
    default: 'other'
  },
  metadata: {
    location: String,
    device: String,
    ip: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

// Index for faster queries
transactionSchema.index({ fromAccount: 1, createdAt: -1 });
transactionSchema.index({ toAccount: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });

// Method to get transaction details
transactionSchema.methods.getDetails = function() {
  return {
    id: this._id,
    amount: this.amount,
    currency: this.currency,
    type: this.type,
    status: this.status,
    description: this.description,
    category: this.category,
    createdAt: this.createdAt,
    completedAt: this.completedAt
  };
};

// Static method to get user's transaction history
transactionSchema.statics.getUserTransactions = async function(accountIds, limit = 10) {
  return this.find({
    $or: [
      { fromAccount: { $in: accountIds } },
      { toAccount: { $in: accountIds } }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('fromAccount', 'accountNumber')
    .populate('toAccount', 'accountNumber');
};

// Static method to get spending by category
transactionSchema.statics.getSpendingByCategory = async function(accountId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        fromAccount: accountId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' }
      }
    }
  ]);
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
