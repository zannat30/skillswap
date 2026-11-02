const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Session = require('../models/Session');
const Transaction = require('../models/Transaction');
const ChatLog = require('../models/ChatLog');
const { isMongoConnected } = require('../config/db');
const { getStore, generateId } = require('../config/memoryStore');
const { calculateEscrowSplit, validateStateTransition } = require('../utils/escrowEngine');

// Feature #51: GET /api/admin/disputes
const getDisputedSessions = async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const disputed = await Session.find({ status: 'DISPUTED' }).sort({ updatedAt: -1 });
      const enriched = await Promise.all(
        disputed.map(async (s) => {
          const chatLogs = await ChatLog.find({ sessionId: s._id }).sort({ timestamp: 1 });
          const mp = await UserProfile.findOne({ userId: s.mentorId });
          const lp = await UserProfile.findOne({ userId: s.learnerId });
          return {
            ...s.toObject(),
            mentorName: mp ? mp.displayName : 'Mentor',
            learnerName: lp ? lp.displayName : 'Learner',
            chatLogs
          };
        })
      );
      return res.status(200).json({ success: true, disputes: enriched });
    }

    const store = getStore();
    const disputes = store.sessions
      .filter((s) => s.status === 'DISPUTED')
      .map((s) => {
        const mp = store.userProfiles.find((p) => String(p.userId) === String(s.mentorId));
        const lp = store.userProfiles.find((p) => String(p.userId) === String(s.learnerId));
        const chatLogs = store.chatLogs.filter((c) => String(c.sessionId) === String(s._id));
        return {
          ...s,
          mentorName: mp ? mp.displayName : 'Alex Rivera',
          learnerName: lp ? lp.displayName : 'Zannat',
          chatLogs
        };
      });

    return res.status(200).json({ success: true, disputes });
  } catch (err) {
    next(err);
  }
};

// Feature #52: POST /api/admin/disputes/:id/refund (Admin Approves Learner Refund -> +50 CR Learner)
const approveDisputeRefund = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      const session = await Session.findById(id);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Disputed session not found.' }
        });
      }

      const check = validateStateTransition(session.status, 'REFUNDED', 'ADMIN', false, false);
      if (!check.valid) {
        return res.status(check.status).json({
          success: false,
          error: { code: check.code, httpStatus: check.status, message: check.message }
        });
      }

      const learner = await User.findById(session.learnerId);
      if (learner) {
        learner.credits += session.creditsLocked;
        await learner.save();
      }

      session.status = 'REFUNDED';
      session.completedAt = new Date();
      await session.save();

      await Transaction.create({
        userId: session.learnerId,
        sessionId: session._id,
        type: 'REFUND',
        amount: session.creditsLocked,
        balanceAfter: learner ? learner.credits : null,
        description: `Admin Dispute Ruling: +${session.creditsLocked} CR Refunded to Learner`
      });

      return res.status(200).json({
        success: true,
        message: 'Dispute upheld. 50 Credits refunded to Learner.',
        settlement: {
          sessionId: String(session._id),
          newStatus: 'REFUNDED',
          learnerRefunded: session.creditsLocked,
          mentorCredited: 0
        }
      });
    }

    const store = getStore();
    const session = store.sessions.find((s) => String(s._id) === String(id));
    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Disputed session not found.' }
      });
    }

    const check = validateStateTransition(session.status, 'REFUNDED', 'ADMIN', false, false);
    if (!check.valid) {
      return res.status(check.status).json({
        success: false,
        error: { code: check.code, httpStatus: check.status, message: check.message }
      });
    }

    const learner = store.users.find((u) => String(u._id) === String(session.learnerId));
    if (learner) {
      learner.credits += session.creditsLocked;
    }

    session.status = 'REFUNDED';
    session.completedAt = new Date();

    store.transactions.unshift({
      _id: generateId(),
      userId: String(session.learnerId),
      sessionId: session._id,
      type: 'REFUND',
      amount: session.creditsLocked,
      balanceAfter: learner ? learner.credits : null,
      description: `Admin Dispute Ruling: +${session.creditsLocked} CR Refunded to Learner`,
      createdAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'Dispute upheld. 50 Credits refunded to Learner.',
      settlement: {
        sessionId: String(session._id),
        newStatus: 'REFUNDED',
        learnerRefunded: session.creditsLocked,
        mentorCredited: 0
      }
    });
  } catch (err) {
    next(err);
  }
};

// Feature #53: POST /api/admin/disputes/:id/release (Admin Rejects Dispute -> +45 CR Mentor, 5 CR Burn)
const rejectDisputeReleaseToMentor = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      const session = await Session.findById(id);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Disputed session not found.' }
        });
      }

      const check = validateStateTransition(session.status, 'COMPLETED', 'ADMIN', false, false);
      if (!check.valid) {
        return res.status(check.status).json({
          success: false,
          error: { code: check.code, httpStatus: check.status, message: check.message }
        });
      }

      const { mentorCredited, platformBurned } = calculateEscrowSplit(session.creditsLocked);
      const mentor = await User.findById(session.mentorId);
      if (mentor) {
        mentor.credits += mentorCredited;
        await mentor.save();
      }

      session.status = 'COMPLETED';
      session.completedAt = new Date();
      await session.save();

      await Transaction.create([
        {
          userId: session.mentorId,
          sessionId: session._id,
          type: 'RELEASE',
          amount: mentorCredited,
          balanceAfter: mentor ? mentor.credits : null,
          description: `Admin Dispute Ruling: +${mentorCredited} CR Released to Mentor`
        },
        {
          userId: session.learnerId,
          sessionId: session._id,
          type: 'BURN',
          amount: -platformBurned,
          balanceAfter: null,
          description: `Admin Dispute Ruling: -${platformBurned} CR Deflationary Burn`
        }
      ]);

      return res.status(200).json({
        success: true,
        message: `Dispute dismissed. ${mentorCredited} Credits released to Mentor, ${platformBurned} Credits burned.`,
        settlement: {
          sessionId: String(session._id),
          newStatus: 'COMPLETED',
          mentorCredited,
          platformBurned
        }
      });
    }

    const store = getStore();
    const session = store.sessions.find((s) => String(s._id) === String(id));
    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Disputed session not found.' }
      });
    }

    const check = validateStateTransition(session.status, 'COMPLETED', 'ADMIN', false, false);
    if (!check.valid) {
      return res.status(check.status).json({
        success: false,
        error: { code: check.code, httpStatus: check.status, message: check.message }
      });
    }

    const { mentorCredited, platformBurned } = calculateEscrowSplit(session.creditsLocked);
    const mentor = store.users.find((u) => String(u._id) === String(session.mentorId));
    if (mentor) {
      mentor.credits += mentorCredited;
    }

    session.status = 'COMPLETED';
    session.completedAt = new Date();

    store.transactions.unshift(
      {
        _id: generateId(),
        userId: String(session.mentorId),
        sessionId: session._id,
        type: 'RELEASE',
        amount: mentorCredited,
        balanceAfter: mentor ? mentor.credits : null,
        description: `Admin Dispute Ruling: +${mentorCredited} CR Released to Mentor`,
        createdAt: new Date()
      },
      {
        _id: generateId(),
        userId: String(session.learnerId),
        sessionId: session._id,
        type: 'BURN',
        amount: -platformBurned,
        balanceAfter: null,
        description: `Admin Dispute Ruling: -${platformBurned} CR Deflationary Burn`,
        createdAt: new Date()
      }
    );

    return res.status(200).json({
      success: true,
      message: `Dispute dismissed. ${mentorCredited} Credits released to Mentor, ${platformBurned} Credits burned.`,
      settlement: {
        sessionId: String(session._id),
        newStatus: 'COMPLETED',
        mentorCredited,
        platformBurned
      }
    });
  } catch (err) {
    next(err);
  }
};

// Feature #54: PUT /api/admin/users/:userId/ban
const toggleBanUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isBanned } = req.body || {};

    if (isMongoConnected()) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', httpStatus: 404, message: 'User not found.' }
        });
      }
      user.isBanned = typeof isBanned === 'boolean' ? isBanned : !user.isBanned;
      await user.save();

      return res.status(200).json({
        success: true,
        message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully.`,
        user: {
          _id: String(user._id),
          email: user.email,
          isBanned: user.isBanned
        }
      });
    }

    const store = getStore();
    const user = store.users.find((u) => String(u._id) === String(userId));
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', httpStatus: 404, message: 'User not found.' }
      });
    }
    user.isBanned = typeof isBanned === 'boolean' ? isBanned : !user.isBanned;

    return res.status(200).json({
      success: true,
      message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully.`,
      user: {
        _id: String(user._id),
        email: user.email,
        isBanned: user.isBanned
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDisputedSessions,
  approveDisputeRefund,
  rejectDisputeReleaseToMentor,
  toggleBanUser
};
