const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accountType: {
    type: String,
    enum: ['checking', 'savings', 'investment'],
    required: true
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'EUR'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastTransaction: {
    type: Date
  },
  limits: {
    dailyTransfer: {
      type: Number,
      default: 5000
    },
    monthlyTransfer: {
      type: Number,
      default: 50000
    }
  }
});

// Method to get account summary
accountSchema.methods.getSummary = function() {
  return {
    id: this._id,
    accountType: this.accountType,
    accountNumber: this.accountNumber,
    balance: this.balance,
    currency: this.currency
  };
};

// Static method to find active accounts for a user
accountSchema.statics.findActiveAccountsForUser = function(userId) {
  return this.find({
    userId,
    isActive: true
  }).sort({ createdAt: -1 });
};

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
