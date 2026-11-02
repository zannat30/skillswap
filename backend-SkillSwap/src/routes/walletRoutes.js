const express = require('express');
const router = express.Router();
const {
  getWalletBalance,
  getTransactions,
  claimStreakBonus
} = require('../controllers/walletController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/balance', optionalAuth, getWalletBalance);
router.get('/transactions', optionalAuth, getTransactions);
router.post('/claim-streak', optionalAuth, claimStreakBonus);

module.exports = router;
