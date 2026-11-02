const express = require('express');
const router = express.Router();
const {
  bookSession,
  getActiveSessions,
  getSessionHistory,
  getSessionById,
  startSession,
  updateMeetingLink,
  completeSession,
  disputeSession,
  cancelSession,
  submitFeedback,
  getSessionChat,
  sendSessionChat
} = require('../controllers/sessionController');
const { optionalAuth } = require('../middleware/authMiddleware');
const domainFilterMiddleware = require('../middleware/domainFilterMiddleware');

router.post('/book', optionalAuth, domainFilterMiddleware, bookSession);
router.get('/active', optionalAuth, getActiveSessions);
router.get('/history', optionalAuth, getSessionHistory);
router.get('/:id/chat', optionalAuth, getSessionChat);
router.post('/:id/chat', optionalAuth, sendSessionChat);
router.get('/:id', optionalAuth, getSessionById);
router.post('/:id/start', optionalAuth, startSession);
router.put('/:id/meeting-link', optionalAuth, updateMeetingLink);
router.post('/:id/complete', optionalAuth, completeSession);
router.post('/:id/dispute', optionalAuth, disputeSession);
router.post('/:id/cancel', optionalAuth, cancelSession);
router.post('/:id/feedback', optionalAuth, submitFeedback);

module.exports = router;
