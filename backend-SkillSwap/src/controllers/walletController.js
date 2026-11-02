const User = require('../models/User');
const Session = require('../models/Session');
const Transaction = require('../models/Transaction');
const { isMongoConnected } = require('../config/db');
const { getStore, generateId } = require('../config/memoryStore');

// Feature #40: GET /api/wallet/balance
const getWalletBalance = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    if (isMongoConnected()) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', httpStatus: 404, message: 'User not found.' }
        });
      }

      const activeSessions = await Session.find({
        learnerId: userId,
        status: { $in: ['PENDING', 'ACTIVE', 'DISPUTED'] }
      });
      const lockedInEscrow = activeSessions.reduce((sum, s) => sum + (s.creditsLocked || 50), 0);

      return res.status(200).json({
        success: true,
        wallet: {
          availableCredits: user.credits,
          lockedInEscrow,
          totalCredits: user.credits + lockedInEscrow,
          streakCount: user.streakCount
        }
      });
    }

    const store = getStore();
    const user = store.users.find((u) => String(u._id) === String(userId)) || store.users[0];
    const lockedTxs = store.transactions.filter(
      (t) => String(t.userId) === String(user._id) && t.type === 'ESCROW_LOCK'
    );
    const activeSessions = store.sessions.filter(
      (s) =>
        String(s.learnerId) === String(user._id) &&
        ['PENDING', 'ACTIVE', 'DISPUTED'].includes(s.status)
    );
    const lockedInEscrow =
      lockedTxs.length > 0
        ? activeSessions.reduce((sum, s) => sum + (s.creditsLocked || 50), 0)
        : 0;

    return res.status(200).json({
      success: true,
      wallet: {
        availableCredits: user.credits,
        lockedInEscrow,
        totalCredits: user.credits + lockedInEscrow,
        streakCount: user.streakCount
      }
    });
  } catch (err) {
    next(err);
  }
};

// Feature #41: GET /api/wallet/transactions
const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    if (isMongoConnected()) {
      const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, transactions });
    }

    const store = getStore();
    const transactions = store.transactions.filter((t) => String(t.userId) === String(userId));
    return res.status(200).json({ success: true, transactions });
  } catch (err) {
    next(err);
  }
};

// Feature #48: POST /api/wallet/claim-streak
const claimStreakBonus = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const milestone = Number(process.env.STREAK_MILESTONE_DAYS) || 7;
    const bonusAmount = Number(process.env.STREAK_BONUS_CREDITS) || 20;

    if (isMongoConnected()) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', httpStatus: 404, message: 'User not found.' }
        });
      }

      if ((user.streakCount || 0) < milestone) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'STREAK_NOT_ELIGIBLE',
            httpStatus: 400,
            message: `A minimum ${milestone}-day streak is required to claim the +${bonusAmount} CR reward.`
          }
        });
      }

      user.credits += bonusAmount;
      user.streakClaimedAt = new Date();
      await user.save();

      const tx = await Transaction.create({
        userId: user._id,
        sessionId: null,
        type: 'BONUS',
        amount: bonusAmount,
        balanceAfter: user.credits,
        description: '7-Day Learning Streak Bonus'
      });

      return res.status(200).json({
        success: true,
        message: `+${bonusAmount} Credit Streak Bonus claimed!`,
        credits: user.credits,
        transaction: tx
      });
    }

    const store = getStore();
    const user = store.users.find((u) => String(u._id) === String(userId)) || store.users[0];

    if ((user.streakCount || 0) < milestone) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'STREAK_NOT_ELIGIBLE',
          httpStatus: 400,
          message: `A minimum ${milestone}-day streak is required to claim the +${bonusAmount} CR reward.`
        }
      });
    }

    user.credits += bonusAmount;
    user.streakClaimedAt = new Date();

    const tx = {
      _id: generateId(),
      userId: String(user._id),
      sessionId: null,
      type: 'BONUS',
      amount: bonusAmount,
      balanceAfter: user.credits,
      description: '7-Day Learning Streak Bonus',
      createdAt: new Date()
    };
    store.transactions.unshift(tx);

    return res.status(200).json({
      success: true,
      message: `+${bonusAmount} Credit Streak Bonus claimed!`,
      credits: user.credits,
      transaction: tx
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWalletBalance,
  getTransactions,
  claimStreakBonus
};
