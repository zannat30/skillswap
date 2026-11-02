const mongoose = require('mongoose');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Session = require('../models/Session');
const Transaction = require('../models/Transaction');
const ChatLog = require('../models/ChatLog');
const { isMongoConnected } = require('../config/db');
const { getStore, generateId } = require('../config/memoryStore');
const { calculateEscrowSplit, validateStateTransition } = require('../utils/escrowEngine');

const getInitials = (name = 'U') => {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return String(name).slice(0, 2).toUpperCase();
};

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

// Feature #52: POST /api/admin/disputes/:id/refund (with Mongoose Multi-Document ACID Transaction)
const approveDisputeRefund = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      const dbSession = await mongoose.startSession();
      let settlementPayload = null;
      let httpErr = null;

      try {
        await dbSession.withTransaction(async () => {
          const session = await Session.findById(id).session(dbSession);
          if (!session) {
            httpErr = {
              status: 404,
              code: 'SESSION_NOT_FOUND',
              message: 'Disputed session not found.'
            };
            throw new Error('ABORT_TX');
          }

          const check = validateStateTransition(session.status, 'REFUNDED', 'ADMIN', false, false);
          if (!check.valid) {
            httpErr = {
              status: check.status,
              code: check.code,
              message: check.message
            };
            throw new Error('ABORT_TX');
          }

          const learner = await User.findById(session.learnerId).session(dbSession);
          if (learner) {
            learner.credits += session.creditsLocked;
            await learner.save({ session: dbSession });
          }

          session.status = 'REFUNDED';
          session.completedAt = new Date();
          await session.save({ session: dbSession });

          await Transaction.create(
            [
              {
                userId: session.learnerId,
                sessionId: session._id,
                type: 'REFUND',
                amount: session.creditsLocked,
                balanceAfter: learner ? learner.credits : null,
                description: `Admin Dispute Ruling: +${session.creditsLocked} CR Refunded to Learner`
              }
            ],
            { session: dbSession }
          );

          settlementPayload = {
            sessionId: String(session._id),
            newStatus: 'REFUNDED',
            learnerRefunded: session.creditsLocked,
            mentorCredited: 0
          };
        });
      } catch (txErr) {
        if (httpErr) {
          return res.status(httpErr.status).json({
            success: false,
            error: {
              code: httpErr.code,
              httpStatus: httpErr.status,
              message: httpErr.message
            }
          });
        }
        throw txErr;
      } finally {
        await dbSession.endSession();
      }

      return res.status(200).json({
        success: true,
        message: 'Dispute upheld. 50 Credits refunded to Learner.',
        settlement: settlementPayload
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

// Feature #53: POST /api/admin/disputes/:id/release (with Mongoose Multi-Document ACID Transaction)
const rejectDisputeReleaseToMentor = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      const dbSession = await mongoose.startSession();
      let settlementPayload = null;
      let httpErr = null;

      try {
        await dbSession.withTransaction(async () => {
          const session = await Session.findById(id).session(dbSession);
          if (!session) {
            httpErr = {
              status: 404,
              code: 'SESSION_NOT_FOUND',
              message: 'Disputed session not found.'
            };
            throw new Error('ABORT_TX');
          }

          const check = validateStateTransition(session.status, 'COMPLETED', 'ADMIN', false, false);
          if (!check.valid) {
            httpErr = {
              status: check.status,
              code: check.code,
              message: check.message
            };
            throw new Error('ABORT_TX');
          }

          const { mentorCredited, platformBurned } = calculateEscrowSplit(session.creditsLocked);
          const mentor = await User.findById(session.mentorId).session(dbSession);
          if (mentor) {
            mentor.credits += mentorCredited;
            await mentor.save({ session: dbSession });
          }

          session.status = 'COMPLETED';
          session.completedAt = new Date();
          await session.save({ session: dbSession });

          await Transaction.create(
            [
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
            ],
            { session: dbSession, ordered: true }
          );

          settlementPayload = {
            sessionId: String(session._id),
            newStatus: 'COMPLETED',
            mentorCredited,
            platformBurned
          };
        });
      } catch (txErr) {
        if (httpErr) {
          return res.status(httpErr.status).json({
            success: false,
            error: {
              code: httpErr.code,
              httpStatus: httpErr.status,
              message: httpErr.message
            }
          });
        }
        throw txErr;
      } finally {
        await dbSession.endSession();
      }

      return res.status(200).json({
        success: true,
        message: `Dispute dismissed. ${settlementPayload.mentorCredited} Credits released to Mentor, ${settlementPayload.platformBurned} Credits burned.`,
        settlement: settlementPayload
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

// GET /api/admin/users (List all users for Admin Moderation)
const getAllUsers = async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const users = await User.find().sort({ createdAt: -1 });
      const enriched = await Promise.all(
        users.map(async (u) => {
          const p = await UserProfile.findOne({ userId: u._id });
          const displayName = p ? p.displayName : u.email.split('@')[0];
          return {
            _id: String(u._id),
            email: u.email,
            displayName,
            initials: getInitials(displayName),
            role: u.role,
            credits: u.credits,
            isBanned: Boolean(u.isBanned),
            totalSessions: p ? p.totalSessions : 0,
            rating: p ? p.rating : 5.0
          };
        })
      );
      return res.status(200).json({ success: true, users: enriched });
    }

    const store = getStore();
    const users = store.users.map((u) => {
      const p = store.userProfiles.find((prof) => String(prof.userId) === String(u._id));
      const displayName = p ? p.displayName : u.email.split('@')[0];
      return {
        _id: String(u._id),
        email: u.email,
        displayName,
        initials: p?.initials || getInitials(displayName),
        role: u.role,
        credits: u.credits,
        isBanned: Boolean(u.isBanned),
        totalSessions: p ? p.totalSessions : 0,
        rating: p ? p.rating : 5.0
      };
    });

    return res.status(200).json({ success: true, users });
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

// Feature #55: DELETE /api/admin/users/:userId (Permanently Remove User & Refund Any Active Escrow)
const removeUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const actorId = req.user ? req.user.userId : null;

    if (String(userId) === String(actorId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_OPERATION',
          httpStatus: 403,
          message: 'An Administrator cannot delete their own account.'
        }
      });
    }

    // Disconnect active socket if the removed user is online
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    if (io && userSockets && userSockets.has(String(userId))) {
      const socketId = userSockets.get(String(userId));
      const sock = io.sockets.sockets.get(socketId);
      if (sock) sock.disconnect(true);
      userSockets.delete(String(userId));
    }

    if (isMongoConnected()) {
      const dbSession = await mongoose.startSession();
      let removedPayload = null;
      let httpErr = null;

      try {
        await dbSession.withTransaction(async () => {
          const user = await User.findById(userId).session(dbSession);
          if (!user) {
            httpErr = {
              status: 404,
              code: 'USER_NOT_FOUND',
              message: 'User not found.'
            };
            throw new Error('ABORT_TX');
          }

          if (user.role === 'ADMIN') {
            httpErr = {
              status: 403,
              code: 'FORBIDDEN_OPERATION',
              message: 'Cannot remove another Administrator account.'
            };
            throw new Error('ABORT_TX');
          }

          const profile = await UserProfile.findOne({ userId: user._id }).session(dbSession);
          const displayName = profile ? profile.displayName : user.email;

          // If the removed user is a Mentor on any PENDING/ACTIVE/DISPUTED sessions, refund learners first
          const mentorActiveSessions = await Session.find({
            mentorId: user._id,
            status: { $in: ['PENDING', 'ACTIVE', 'DISPUTED'] }
          }).session(dbSession);

          for (const s of mentorActiveSessions) {
            const refundAmt = s.creditsLocked || 50;
            const learner = await User.findById(s.learnerId).session(dbSession);
            if (learner) {
              learner.credits += refundAmt;
              await learner.save({ session: dbSession });
              await Transaction.create(
                [
                  {
                    userId: learner._id,
                    sessionId: s._id,
                    type: 'REFUND',
                    amount: refundAmt,
                    balanceAfter: learner.credits,
                    description: `Admin Account Removal Refund (+${refundAmt} CR) for ${s.skillName}`
                  }
                ],
                { session: dbSession }
              );
            }
          }

          // Delete user's sessions, profile, and account
          const userSessions = await Session.find({
            $or: [{ learnerId: user._id }, { mentorId: user._id }]
          }).session(dbSession);
          const sessionIds = userSessions.map((s) => s._id);
          if (sessionIds.length > 0) {
            await ChatLog.deleteMany({ sessionId: { $in: sessionIds } }).session(dbSession);
            await Session.deleteMany({ _id: { $in: sessionIds } }).session(dbSession);
          }

          await Transaction.deleteMany({ userId: user._id }).session(dbSession);
          await UserProfile.deleteOne({ userId: user._id }).session(dbSession);
          await User.deleteOne({ _id: user._id }).session(dbSession);

          removedPayload = {
            _id: String(user._id),
            email: user.email,
            displayName
          };
        });
      } catch (txErr) {
        if (httpErr) {
          return res.status(httpErr.status).json({
            success: false,
            error: {
              code: httpErr.code,
              httpStatus: httpErr.status,
              message: httpErr.message
            }
          });
        }
        throw txErr;
      } finally {
        await dbSession.endSession();
      }

      return res.status(200).json({
        success: true,
        message: `User ${removedPayload.displayName} (${removedPayload.email}) has been permanently removed.`,
        removedUser: removedPayload
      });
    }

    // In-Memory Store path
    const store = getStore();
    const userIndex = store.users.findIndex((u) => String(u._id) === String(userId));
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', httpStatus: 404, message: 'User not found.' }
      });
    }

    const targetUser = store.users[userIndex];
    if (targetUser.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_OPERATION',
          httpStatus: 403,
          message: 'Cannot remove another Administrator account.'
        }
      });
    }

    const profile = store.userProfiles.find((p) => String(p.userId) === String(userId));
    const displayName = profile ? profile.displayName : targetUser.email;

    // Refund learners on any active sessions where removed user was Mentor
    store.sessions.forEach((s) => {
      if (
        String(s.mentorId) === String(userId) &&
        ['PENDING', 'ACTIVE', 'DISPUTED'].includes(s.status)
      ) {
        const refundAmt = s.creditsLocked || 50;
        const learner = store.users.find((u) => String(u._id) === String(s.learnerId));
        if (learner) {
          learner.credits += refundAmt;
          store.transactions.unshift({
            _id: generateId(),
            userId: String(learner._id),
            sessionId: s._id,
            type: 'REFUND',
            amount: refundAmt,
            balanceAfter: learner.credits,
            description: `Admin Account Removal Refund (+${refundAmt} CR) for ${s.skillName}`,
            createdAt: new Date()
          });
        }
      }
    });

    // Remove user's sessions, chatLogs, transactions, profile, and user record
    const removedSessionIds = new Set(
      store.sessions
        .filter((s) => String(s.learnerId) === String(userId) || String(s.mentorId) === String(userId))
        .map((s) => String(s._id))
    );
    store.chatLogs = store.chatLogs.filter((c) => !removedSessionIds.has(String(c.sessionId)));
    store.sessions = store.sessions.filter(
      (s) => String(s.learnerId) !== String(userId) && String(s.mentorId) !== String(userId)
    );
    store.transactions = store.transactions.filter((t) => String(t.userId) !== String(userId));
    store.userProfiles = store.userProfiles.filter((p) => String(p.userId) !== String(userId));
    store.users.splice(userIndex, 1);

    return res.status(200).json({
      success: true,
      message: `User ${displayName} (${targetUser.email}) has been permanently removed.`,
      removedUser: {
        _id: String(targetUser._id),
        email: targetUser.email,
        displayName
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
  getAllUsers,
  toggleBanUser,
  removeUser
};
