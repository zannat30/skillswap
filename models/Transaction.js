const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
        type: String, 
        enum: ['bonus', 'payment', 'escrow_lock', 'escrow_release', 'fee'], 
        required: true 
    },
    amount: { type: Number, required: true }, 
    description: { type: String, required: true },
    relatedSession: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
