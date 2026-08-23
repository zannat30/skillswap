const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
        type: String, 
        enum: ['pending', 'active', 'completed', 'disputed'], 
        default: 'pending' 
    },
    escrowAmount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    totalLocked: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
});

module.exports = mongoose.model('Session', SessionSchema);
