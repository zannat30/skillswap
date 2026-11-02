const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  learnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING',
    index: true
  },
  skillName: {
    type: String,
    required: true,
    trim: true
  },
  domain: {
    type: String,
    enum: ['Technology', 'Creative Arts', 'Languages', 'Academics'],
    default: 'Technology',
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  creditsLocked: {
    type: Number,
    default: 50
  },
  meetingLink: {
    type: String,
    default: 'https://meet.google.com/new'
  },
  disputeReason: {
    type: String,
    default: ''
  },
  // Mentor availability slot consumed by this booking (restored on cancellation)
  bookedSlot: {
    date: { type: String },
    slot: { type: String }
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 400 },
    submittedAt: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);
