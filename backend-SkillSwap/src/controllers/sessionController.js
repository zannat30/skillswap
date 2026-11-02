const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Session = require('../models/Session');
const Transaction = require('../models/Transaction');
const ChatLog = require('../models/ChatLog');
const { isMongoConnected } = require('../config/db');
const { getStore, generateId } = require('../config/memoryStore');
const {
  SESSION_COST,
  calculateEscrowSplit,
  validateStateTransition
} = require('../utils/escrowEngine');

const getInitials = (name = 'M') => {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return String(name).slice(0, 2).toUpperCase();
};

const enrichSessionInMemory = (s, store) => {
  const mentorProfile = store.userProfiles.find((p) => String(p.userId) === String(s.mentorId));
  const learnerProfile = store.userProfiles.find((p) => String(p.userId) === String(s.learnerId));
  const mentorName = mentorProfile ? mentorProfile.displayName : 'Alex Rivera';
  const learnerName = learnerProfile ? learnerProfile.displayName : 'Zannat';
  return {
    ...s,
    mentorName,
    mentorInitials: mentorProfile?.initials || getInitials(mentorName),
    learnerName,
    learnerInitials: learnerProfile?.initials || getInitials(learnerName)
  };
};

// Feature #28: POST /api/sessions/book
const bookSession = async (req, res, next) => {
  try {
    const learnerId = req.body.learnerId || req.user.userId;
    const {
      mentorId,
      mentorName,
      skillName = 'React.js State Management',
      domain = 'Technology',
      scheduledTime
    } = req.body || {};

    const sessionCost = SESSION_COST; // 50 CR

    if (isMongoConnected()) {
      const learner = await User.findById(learnerId);
      if (!learner) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', httpStatus: 404, message: 'Learner not found.' }
        });
      }

      if (learner.credits < sessionCost) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_CREDITS',
            httpStatus: 400,
            message: `Learner has fewer than ${sessionCost} CR available in wallet.`
          }
        });
      }

      let resolvedMentorId = mentorId;
      if (!resolvedMentorId && mentorName) {
        const mp = await UserProfile.findOne({ displayName: mentorName });
        if (mp) resolvedMentorId = mp.userId;
      }

      learner.credits -= sessionCost;
      await learner.save();

      const sessionDoc = await Session.create({
        learnerId: learner._id,
        mentorId: resolvedMentorId || learner._id,
        status: 'PENDING',
        skillName,
        domain,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(Date.now() + 3600000),
        creditsLocked: sessionCost
      });

      await Transaction.create({
        userId: learner._id,
        sessionId: sessionDoc._id,
        type: 'ESCROW_LOCK',
        amount: -sessionCost,
        balanceAfter: learner.credits,
        description: `Locked ${sessionCost} CR in Escrow for ${skillName}`
      });

      // Notify Mentor over Socket.io if connected
      const io = req.app.get('io');
      const userSockets = req.app.get('userSockets');
      if (io && userSockets && userSockets.has(String(resolvedMentorId))) {
        const learnerProfile = await UserProfile.findOne({ userId: learner._id });
        io.to(userSockets.get(String(resolvedMentorId))).emit('session-request', {
          sessionId: String(sessionDoc._id),
          learnerName: learnerProfile ? learnerProfile.displayName : learner.email,
          skillName
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Session booked successfully. 50 Credits locked in Escrow.',
        session: {
          _id: String(sessionDoc._id),
          status: sessionDoc.status,
          skillName: sessionDoc.skillName,
          domain: sessionDoc.domain,
          mentorId: String(sessionDoc.mentorId),
          learnerId: String(sessionDoc.learnerId),
          creditsLocked: sessionDoc.creditsLocked,
          learnerWalletRemaining: learner.credits
        }
      });
    }

    // In-Memory Store path
    const store = getStore();
    const learner = store.users.find((u) => String(u._id) === String(learnerId));
    if (!learner) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', httpStatus: 404, message: 'Learner not found.' }
      });
    }

    if (learner.credits < sessionCost) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_CREDITS',
          httpStatus: 400,
          message: `Learner has fewer than ${sessionCost} CR available in wallet.`
        }
      });
    }

    let resolvedMentorProfile = store.userProfiles.find(
      (p) =>
        String(p.userId) === String(mentorId) ||
        (mentorName && p.displayName.toLowerCase() === String(mentorName).toLowerCase())
    );
    const resolvedMentorId = resolvedMentorProfile
      ? resolvedMentorProfile.userId
      : mentorId || '664f1a2b3c4d5e6f7a8b9c99';

    learner.credits -= sessionCost;

    const newSession = {
      _id: generateId(),
      learnerId: String(learner._id),
      mentorId: String(resolvedMentorId),
      status: 'PENDING',
      skillName,
      domain,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(Date.now() + 3600000),
      startedAt: null,
      completedAt: null,
      creditsLocked: sessionCost,
      meetingLink: 'https://meet.google.com/new',
      disputeReason: '',
      feedback: null,
      createdAt: new Date()
    };
    store.sessions.unshift(newSession);

    store.transactions.unshift({
      _id: generateId(),
      userId: String(learner._id),
      sessionId: newSession._id,
      type: 'ESCROW_LOCK',
      amount: -sessionCost,
      balanceAfter: learner.credits,
      description: `Locked ${sessionCost} CR in Escrow (${skillName})`,
      createdAt: new Date()
    });

    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    if (io && userSockets && userSockets.has(String(resolvedMentorId))) {
      const learnerProfile = store.userProfiles.find((p) => String(p.userId) === String(learner._id));
      io.to(userSockets.get(String(resolvedMentorId))).emit('session-request', {
        sessionId: newSession._id,
        learnerName: learnerProfile ? learnerProfile.displayName : learner.email,
        skillName
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Session booked successfully. 50 Credits locked in Escrow.',
      session: {
        ...enrichSessionInMemory(newSession, store),
        learnerWalletRemaining: learner.credits
      }
    });
  } catch (err) {
    next(err);
  }
};

// Feature #29: GET /api/sessions/active
const getActiveSessions = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    if (isMongoConnected()) {
      const sessions = await Session.find({
        $or: [{ learnerId: userId }, { mentorId: userId }],
        status: { $in: ['PENDING', 'ACTIVE', 'DISPUTED'] }
      }).sort({ createdAt: -1 });

      const enriched = await Promise.all(
        sessions.map(async (s) => {
          const mp = await UserProfile.findOne({ userId: s.mentorId });
          const lp = await UserProfile.findOne({ userId: s.learnerId });
          const mentorName = mp ? mp.displayName : 'Alex Rivera';
          const learnerName = lp ? lp.displayName : 'Zannat';
          return {
            ...s.toObject(),
            mentorName,
            mentorInitials: getInitials(mentorName),
            learnerName,
            learnerInitials: getInitials(learnerName)
          };
        })
      );

      return res.status(200).json({ success: true, sessions: enriched });
    }

    const store = getStore();
    const sessions = store.sessions
      .filter(
        (s) =>
          (String(s.learnerId) === String(userId) || String(s.mentorId) === String(userId)) &&
          ['PENDING', 'ACTIVE', 'DISPUTED'].includes(s.status)
      )
      .map((s) => enrichSessionInMemory(s, store));

    return res.status(200).json({ success: true, sessions });
  } catch (err) {
    next(err);
  }
};

// Feature #30: GET /api/sessions/history
const getSessionHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    if (isMongoConnected()) {
      const sessions = await Session.find({
        $or: [{ learnerId: userId }, { mentorId: userId }],
        status: { $in: ['COMPLETED', 'CANCELLED', 'REFUNDED'] }
      }).sort({ completedAt: -1, updatedAt: -1 });
      return res.status(200).json({ success: true, sessions });
    }

    const store = getStore();
    const sessions = store.sessions
      .filter(
        (s) =>
          (String(s.learnerId) === String(userId) || String(s.mentorId) === String(userId)) &&
          ['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(s.status)
      )
      .map((s) => enrichSessionInMemory(s, store));

    return res.status(200).json({ success: true, sessions });
  } catch (err) {
    next(err);
  }
};

// Feature #31: GET /api/sessions/:id
const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      const session = await Session.findById(id);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Session not found.' }
        });
      }
      const mp = await UserProfile.findOne({ userId: session.mentorId });
      const lp = await UserProfile.findOne({ userId: session.learnerId });
      return res.status(200).json({
        success: true,
        session: {
          ...session.toObject(),
          mentorName: mp ? mp.displayName : 'Alex Rivera',
          mentorInitials: getInitials(mp ? mp.displayName : 'AR'),
          learnerName: lp ? lp.displayName : 'Zannat',
          learnerInitials: getInitials(lp ? lp.displayName : 'Z')
        }
      });
    }

    const store = getStore();
    const session = store.sessions.find((s) => String(s._id) === String(id));
    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Session not found.' }
      });
    }
    return res.status(200).json({
      success: true,
      session: enrichSessionInMemory(session, store)
    });
  } catch (err) {
    next(err);
  }
};

// Feature #32: POST /api/sessions/:id/start (Mentor Only)
const startSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user.userId;

    if (isMongoConnected()) {
      const session = await Session.findById(id);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Session not found.' }
        });
      }

      const isMentor = String(session.mentorId) === String(actorId);
      const isLearner = String(session.learnerId) === String(actorId);
      const check = validateStateTransition(session.status, 'ACTIVE', req.user.role, isMentor, isLearner);
      if (!check.valid) {
        return res.status(check.status).json({
          success: false,
          error: { code: check.code, httpStatus: check.status, message: check.message }
        });
      }

      session.status = 'ACTIVE';
      session.startedAt = new Date();
      await session.save();

      return res.status(200).json({
        success: true,
        message: 'Session started! 60-minute countdown timer initialized.',
        session
      });
    }

    const store = getStore();
    const session = store.sessions.find((s) => String(s._id) === String(id));
    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Session not found.' }
      });
    }

    const isMentor = String(session.mentorId) === String(actorId);
    const isLearner = String(session.learnerId) === String(actorId);
    const check = validateStateTransition(session.status, 'ACTIVE', req.user.role, isMentor, isLearner);
    if (!check.valid) {
      return res.status(check.status).json({
        success: false,
        error: { code: check.code, httpStatus: check.status, message: check.message }
      });
    }

    session.status = 'ACTIVE';
    session.startedAt = new Date();

    return res.status(200).json({
      success: true,
      message: 'Session started! 60-minute countdown timer initialized.',
      session: enrichSessionInMemory(session, store)
    });
  } catch (err) {
    next(err);
  }
};

// Feature #33: PUT /api/sessions/:id/meeting-link
const updateMeetingLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { meetingLink } = req.body || {};
    if (!meetingLink) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', httpStatus: 400, message: 'meetingLink is required.' }
      });
    }

    if (isMongoConnected()) {
      const session = await Session.findById(id);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Session not found.' }
        });
      }
      session.meetingLink = meetingLink;
      await session.save();
      return res.status(200).json({ success: true, session });
    }

    const store = getStore();
    const session = store.sessions.find((s) => String(s._id) === String(id));
    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Session not found.' }
      });
    }
    session.meetingLink = meetingLink;
    return res.status(200).json({ success: true, session: enrichSessionInMemory(session, store) });
  } catch (err) {
    next(err);
  }
};

// Feature #34, #37, #39: POST /api/sessions/:id/complete (Learner Marks as Learnt -> 90/10 Split)
const completeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user.userId;
    const { rating = 5, comment = '' } = req.body || {};

    if (isMongoConnected()) {
      const session = await Session.findById(id);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Session not found.' }
        });
      }

      const isMentor = String(session.mentorId) === String(actorId);
      const isLearner = String(session.learnerId) === String(actorId);
      const check = validateStateTransition(session.status, 'COMPLETED', req.user.role, isMentor, isLearner);
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

      const mentorProfile = await UserProfile.findOne({ userId: session.mentorId });
      if (mentorProfile) {
        const prevTotal = mentorProfile.totalSessions || 0;
        const prevRating = mentorProfile.rating || 5.0;
        const numRating = Math.min(5, Math.max(1, Number(rating) || 5));
        mentorProfile.totalSessions = prevTotal + 1;
        mentorProfile.rating = Number(
          ((prevRating * prevTotal + numRating) / (prevTotal + 1)).toFixed(1)
        );
        await mentorProfile.save();
      }

      session.status = 'COMPLETED';
      session.completedAt = new Date();
      session.feedback = {
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        comment: String(comment).slice(0, 400),
        submittedAt: new Date()
      };
      await session.save();

      await Transaction.create([
        {
          userId: session.mentorId,
          sessionId: session._id,
          type: 'RELEASE',
          amount: mentorCredited,
          balanceAfter: mentor ? mentor.credits : null,
          description: `Escrow Release (+${mentorCredited} CR) for teaching ${session.skillName}`
        },
        {
          userId: session.learnerId,
          sessionId: session._id,
          type: 'BURN',
          amount: -platformBurned,
          balanceAfter: null,
          description: `10% Platform Deflationary Burn (-${platformBurned} CR) for ${session.skillName}`
        }
      ]);

      return res.status(200).json({
        success: true,
        message: `Session completed! ${mentorCredited} Credits released to Mentor, ${platformBurned} Credits burned.`,
        settlement: {
          sessionId: String(session._id),
          newStatus: 'COMPLETED',
          mentorCredited,
          platformBurned
        }
      });
    }

    // In-Memory Store path
    const store = getStore();
    const session = store.sessions.find((s) => String(s._id) === String(id));
    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Session not found.' }
      });
    }

    const isMentor = String(session.mentorId) === String(actorId);
    const isLearner = String(session.learnerId) === String(actorId);
    const check = validateStateTransition(session.status, 'COMPLETED', req.user.role, isMentor, isLearner);
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

    const mentorProfile = store.userProfiles.find(
      (p) => String(p.userId) === String(session.mentorId)
    );
    if (mentorProfile) {
      const prevTotal = mentorProfile.totalSessions || 0;
      const prevRating = mentorProfile.rating || 5.0;
      const numRating = Math.min(5, Math.max(1, Number(rating) || 5));
      mentorProfile.totalSessions = prevTotal + 1;
      mentorProfile.rating = Number(
        ((prevRating * prevTotal + numRating) / (prevTotal + 1)).toFixed(1)
      );
    }

    session.status = 'COMPLETED';
    session.completedAt = new Date();
    session.feedback = {
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      comment: String(comment).slice(0, 400),
      submittedAt: new Date()
    };

    store.transactions.unshift(
      {
        _id: generateId(),
        userId: String(session.mentorId),
        sessionId: session._id,
        type: 'RELEASE',
        amount: mentorCredited,
        balanceAfter: mentor ? mentor.credits : null,
        description: `Escrow Release (+${mentorCredited} CR) for teaching ${session.skillName}`,
        createdAt: new Date()
      },
      {
        _id: generateId(),
        userId: String(session.learnerId),
        sessionId: session._id,
        type: 'BURN',
        amount: -platformBurned,
        balanceAfter: null,
        description: `10% Deflationary Fee Burn (-${platformBurned} CR) for ${session.skillName}`,
        createdAt: new Date()
      }
    );

    return res.status(200).json({
      success: true,
      message: `Session completed! ${mentorCredited} Credits released to Mentor, ${platformBurned} Credits burned.`,
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

// Feature #35: POST /api/sessions/:id/dispute (Learner Raises Dispute)
const disputeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user.userId;
    const { reason = 'Mentor did not cover the agreed learning objectives.' } = req.body || {};

    if (isMongoConnected()) {
      const session = await Session.findById(id);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Session not found.' }
        });
      }

      const isMentor = String(session.mentorId) === String(actorId);
      const isLearner = String(session.learnerId) === String(actorId);
      const check = validateStateTransition(session.status, 'DISPUTED', req.user.role, isMentor, isLearner);
      if (!check.valid) {
        return res.status(check.status).json({
          success: false,
          error: { code: check.code, httpStatus: check.status, message: check.message }
        });
      }

      session.status = 'DISPUTED';
      session.disputeReason = reason;
      await session.save();

      return res.status(200).json({
        success: true,
        message: 'Dispute raised. 50 Credits frozen in Escrow pending Admin arbitration.',
        session
      });
    }

    const store = getStore();
    const session = store.sessions.find((s) => String(s._id) === String(id));
    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Session not found.' }
      });
    }

    const isMentor = String(session.mentorId) === String(actorId);
    const isLearner = String(session.learnerId) === String(actorId);
    const check = validateStateTransition(session.status, 'DISPUTED', req.user.role, isMentor, isLearner);
    if (!check.valid) {
      return res.status(check.status).json({
        success: false,
        error: { code: check.code, httpStatus: check.status, message: check.message }
      });
    }

    session.status = 'DISPUTED';
    session.disputeReason = reason;

    return res.status(200).json({
      success: true,
      message: 'Dispute raised. 50 Credits frozen in Escrow pending Admin arbitration.',
      session: enrichSessionInMemory(session, store)
    });
  } catch (err) {
    next(err);
  }
};

// Feature #36: POST /api/sessions/:id/cancel (Cancel Pending Session & Refund 50 CR)
const cancelSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user.userId;

    if (isMongoConnected()) {
      const session = await Session.findById(id);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Session not found.' }
        });
      }

      const isMentor = String(session.mentorId) === String(actorId);
      const isLearner = String(session.learnerId) === String(actorId);
      const check = validateStateTransition(session.status, 'CANCELLED', req.user.role, isMentor, isLearner);
      if (!check.valid) {
        return res.status(check.status).json({
          success: false,
          error: { code: check.code, httpStatus: check.status, message: check.message }
        });
      }

      session.status = 'CANCELLED';
      await session.save();

      const learner = await User.findById(session.learnerId);
      if (learner) {
        learner.credits += session.creditsLocked;
        await learner.save();
      }

      await Transaction.create({
        userId: session.learnerId,
        sessionId: session._id,
        type: 'REFUND',
        amount: session.creditsLocked,
        balanceAfter: learner ? learner.credits : null,
        description: `Escrow Refund (+${session.creditsLocked} CR) for cancelled session: ${session.skillName}`
      });

      return res.status(200).json({
        success: true,
        message: 'Session cancelled and 50 Credits refunded to Learner.',
        session
      });
    }

    const store = getStore();
    const session = store.sessions.find((s) => String(s._id) === String(id));
    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Session not found.' }
      });
    }

    const isMentor = String(session.mentorId) === String(actorId);
    const isLearner = String(session.learnerId) === String(actorId);
    const check = validateStateTransition(session.status, 'CANCELLED', req.user.role, isMentor, isLearner);
    if (!check.valid) {
      return res.status(check.status).json({
        success: false,
        error: { code: check.code, httpStatus: check.status, message: check.message }
      });
    }

    session.status = 'CANCELLED';
    const learner = store.users.find((u) => String(u._id) === String(session.learnerId));
    if (learner) {
      learner.credits += session.creditsLocked;
    }

    store.transactions.unshift({
      _id: generateId(),
      userId: String(session.learnerId),
      sessionId: session._id,
      type: 'REFUND',
      amount: session.creditsLocked,
      balanceAfter: learner ? learner.credits : null,
      description: `Escrow Refund (+${session.creditsLocked} CR) for cancelled session: ${session.skillName}`,
      createdAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'Session cancelled and 50 Credits refunded to Learner.',
      session: enrichSessionInMemory(session, store)
    });
  } catch (err) {
    next(err);
  }
};

// Feature #37 & #39: POST /api/sessions/:id/feedback
const submitFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating = 5, comment = '' } = req.body || {};
    const numRating = Math.min(5, Math.max(1, Number(rating) || 5));

    if (isMongoConnected()) {
      const session = await Session.findById(id);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Session not found.' }
        });
      }
      session.feedback = {
        rating: numRating,
        comment: String(comment).slice(0, 400),
        submittedAt: new Date()
      };
      await session.save();

      const mentorProfile = await UserProfile.findOne({ userId: session.mentorId });
      if (mentorProfile) {
        const count = mentorProfile.totalSessions || 1;
        mentorProfile.rating = Number(
          (((mentorProfile.rating || 5) * count + numRating) / (count + 1)).toFixed(1)
        );
        await mentorProfile.save();
      }

      return res.status(201).json({ success: true, feedback: session.feedback });
    }

    const store = getStore();
    const session = store.sessions.find((s) => String(s._id) === String(id));
    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', httpStatus: 404, message: 'Session not found.' }
      });
    }
    session.feedback = {
      rating: numRating,
      comment: String(comment).slice(0, 400),
      submittedAt: new Date()
    };

    const mentorProfile = store.userProfiles.find(
      (p) => String(p.userId) === String(session.mentorId)
    );
    if (mentorProfile) {
      const count = mentorProfile.totalSessions || 1;
      mentorProfile.rating = Number(
        (((mentorProfile.rating || 5) * count + numRating) / (count + 1)).toFixed(1)
      );
    }

    return res.status(201).json({ success: true, feedback: session.feedback });
  } catch (err) {
    next(err);
  }
};

// Feature #46: GET /api/sessions/:id/chat
const getSessionChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isMongoConnected()) {
      const messages = await ChatLog.find({ sessionId: id }).sort({ timestamp: 1 });
      return res.status(200).json({ success: true, messages });
    }
    const store = getStore();
    const messages = store.chatLogs.filter((c) => String(c.sessionId) === String(id));
    return res.status(200).json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
  getSessionChat
};
