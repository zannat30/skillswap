const mongoose = require('mongoose');

const SkillItemSchema = new mongoose.Schema({
  skill: { type: String, required: true, trim: true },
  domain: {
    type: String,
    enum: ['Technology', 'Creative Arts', 'Languages', 'Academics'],
    default: 'Technology',
    required: true
  },
  level: {
    type: String,
    enum: ['BEGINNER', 'INTERMEDIATE', 'EXPERT'],
    default: 'INTERMEDIATE'
  }
});

const UserProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60
  },
  bio: {
    type: String,
    default: 'Passionate peer learner and mentor on SkillSwap.',
    maxlength: 500
  },
  skillsHave: [SkillItemSchema],
  skillsWant: [SkillItemSchema],
  availability: [{
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    slots: [{ type: String, required: true }] // Format: ["14:00-15:00"]
  }],
  rating: {
    type: Number,
    default: 5.0,
    min: 1.0,
    max: 5.0
  },
  ratingCount: {
    type: Number,
    default: 1
  },
  totalSessions: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Compound text index for fast Marketplace search
UserProfileSchema.index({ 'skillsHave.skill': 'text', displayName: 'text', bio: 'text' });

module.exports = mongoose.model('UserProfile', UserProfileSchema);
