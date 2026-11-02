const express = require('express');
const router = express.Router();
const {
  getDisputedSessions,
  approveDisputeRefund,
  rejectDisputeReleaseToMentor,
  getAllUsers,
  toggleBanUser
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

router.get('/disputes', protect, requireAdmin, getDisputedSessions);
router.post('/disputes/:id/refund', protect, requireAdmin, approveDisputeRefund);
router.post('/disputes/:id/release', protect, requireAdmin, rejectDisputeReleaseToMentor);
router.get('/users', protect, requireAdmin, getAllUsers);
router.put('/users/:userId/ban', protect, requireAdmin, toggleBanUser);

module.exports = router;
