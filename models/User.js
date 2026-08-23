const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    initials: { type: String },
    creditBalance: { type: Number, default: 100 },
    escrowBalance: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    totalSessions: { type: Number, default: 0 },
    category: { type: String, enum: ['technology', 'creative', 'languages', 'academic', 'other'], default: 'technology' },
    skillsHave: [{ type: String }],
    skillsWant: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
