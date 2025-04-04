const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  biometricId: {
    type: String,
    sparse: true
  },
  accounts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  psd2Access: {
    enabled: {
      type: Boolean,
      default: false
    },
    lastAuthorized: {
      type: Date,
      default: null
    },
    consentId: {
      type: String,
      default: null
    },
    consentExpiresAt: {
      type: Date,
      default: null
    }
  },
  biometricEnabled: {
    type: Boolean,
    default: false
  },
  darkModeEnabled: {
    type: Boolean,
    default: false
  }
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get user's public profile
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    accounts: this.accounts,
    preferences: this.preferences
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
