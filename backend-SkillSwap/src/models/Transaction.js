const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null
  },
  type: {
    type: String,
    enum: ['BONUS', 'ESCROW_LOCK', 'RELEASE', 'REFUND', 'BURN'],
    required: true
  },
  amount: {
    type: Number,
    required: true // e.g., +100, -50, +45, -5
  },
  balanceAfter: {
    type: Number,
    default: null
  },
  description: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
