const mongoose = require('mongoose');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Session = require('../models/Session');
const Transaction = require('../models/Transaction');
const ChatLog = require('../models/ChatLog');
const { isMongoConnected } = require('../config/db');
const { getStore, generateId, IDS } = require('../config/memoryStore');
const {
  SESSION_COST,
  calculateEscrowSplit,
  validateStateTransition
} = require('../utils/escrowEngine');

const PENDING_TIMEOUT_MS = () =>
  Number(process.env.PENDING_SESSION_TIMEOUT_MS) || 24 * 60 * 60 * 1000; // 24 hours

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

// Gap 2 (Feature #36 & Section 8): 24-Hour Pending Session Auto-Cancel & +50 CR Refund Sweep
const sweepExpiredPendingSessions = async () => {
  const cutoff = new Date(Date.now() - PENDING_TIMEOUT_MS());
  let sweptCount = 0;

  if (isMongoConnected()) {
    const expiredSessions = await Session.find({
      status: 'PENDING',
      createdAt: { $lte: cutoff }
    });

    for (const exp of expiredSessions) {
      const dbSession = await mongoose.startSession();
      try {
        await dbSession.withTransaction(async () => {
          const session = await Session.findById(exp._id).session(dbSession);
          if (!session || session.status !== 'PENDING') return;

          const refundAmount = session.creditsLocked || SESSION_COST;
          session.status = 'CANCELLED';
          session.creditsLocked = 0;
          await session.save({ session: dbSession });

          if (session.bookedSlot?.date && session.bookedSlot?.slot) {
            const mp = await UserProfile.findOne({ userId: session.mentorId }).session(dbSession);
            if (mp) {
              const entry = mp.availability.find((a) => a.date === session.bookedSlot.date);
              if (entry) {
                if (!entry.slots.includes(session.bookedSlot.slot)) {
                  entry.slots.push(session.bookedSlot.slot);
                }
              } else {
                mp.availability.push({
                  date: session.bookedSlot.date,
                  slots: [session.bookedSlot.slot]
                });
              }
              await mp.save({ session: dbSession });
            }
          }

          const learner = await User.findById(session.learnerId).session(dbSession);
          if (learner) {
            learner.credits += refundAmount;
            await learner.save({ session: dbSession });
          }

          await Transaction.create(
            [
              {
                userId: session.learnerId,
                sessionId: session._id,
                type: 'REFUND',
                amount: refundAmount,
                balanceAfter: learner ? learner.credits : null,
                description: `24h Timeout Auto-Cancel Refund (+${refundAmount} CR) for ${session.skillName}`
              }
            ],
            { session: dbSession }
          );
          sweptCount += 1;
        });
      } catch (_) {
        // Ignore individual sweep failure
      } finally {
        await dbSession.endSession();
      }
    }
    return sweptCount;
  }

  // In-Memory Store path
  const store = getStore();
  store.sessions.forEach((session) => {
    if (session.status === 'PENDING' && new Date(session.createdAt) <= cutoff) {
      const refundAmount = session.creditsLocked || SESSION_COST;
      session.status = 'CANCELLED';
      session.creditsLocked = 0;

      if (session.bookedSlot?.date && session.bookedSlot?.slot) {
        const mp = store.userProfiles.find((p) => String(p.userId) === String(session.mentorId));
        if (mp) {
          if (!Array.isArray(mp.availability)) mp.availability = [];
          const entry = mp.availability.find((a) => a.date === session.bookedSlot.date);
          if (entry) {
            if (!entry.slots.includes(session.bookedSlot.slot)) {
              entry.slots.push(session.bookedSlot.slot);
            }
          } else {
            mp.availability.push({
              _id: generateId(),
              date: session.bookedSlot.date,
              slots: [session.bookedSlot.slot]
            });
          }
        }
      }

      const learner = store.users.find((u) => String(u._id) === String(session.learnerId));
      if (learner) {
        learner.credits += refundAmount;
      }

      store.transactions.unshift({
        _id: generateId(),
        userId: String(session.learnerId),
        sessionId: session._id,
        type: 'REFUND',
        amount: refundAmount,
        balanceAfter: learner ? learner.credits : null,
        description: `24h Timeout Auto-Cancel Refund (+${refundAmount} CR) for ${session.skillName}`,
        createdAt: new Date()
      });
      sweptCount += 1;
    }
  });
  return sweptCount;
};

// Feature #28: POST /api/sessions/book (with Mongoose Multi-Document ACID Transaction)
const bookSession = async (req, res, next) => {
  try {
    const learnerId = req.body.learnerId || req.user.userId;
    const {
      mentorId,
      mentorName,
      skillName = 'React.js State Management',
      domain = 'Technology',
      scheduledTime,
      date,
      slot,
      bookedSlot
    } = req.body || {};

    const chosenDate = bookedSlot?.date || date || '';
    const chosenSlot = bookedSlot?.slot || slot || '';
    const sessionCost = SESSION_COST; // 50 CR

    if (isMongoConnected()) {
      const dbSession = await mongoose.startSession();
      let createdSessionDoc = null;
      let remainingCredits = 0;
      let resolvedMentorId = mentorId;
      let httpErr = null;

      try {
        await dbSession.withTransaction(async () => {
          const learner = await User.findById(learnerId).session(dbSession);
          if (!learner) {
            httpErr = {
              status: 404,
              code: 'USER_NOT_FOUND',
              message: 'Learner not found.'
            };
            throw new Error('ABORT_TX');
          }

          if (learner.credits < sessionCost) {
            httpErr = {
              status: 400,
              code: 'INSUFFICIENT_CREDITS',
              message: `Learner has fewer than ${sessionCost} CR available in wallet.`
            };
            throw new Error('ABORT_TX');
          }

          let mentorProfile = null;
          if (resolvedMentorId) {
            mentorProfile = await UserProfile.findOne({ userId: resolvedMentorId }).session(dbSession);
          } else if (mentorName) {
            mentorProfile = await UserProfile.findOne({ displayName: mentorName }).session(dbSession);
            if (mentorProfile) resolvedMentorId = mentorProfile.userId;
          }

          if (String(resolvedMentorId) === String(learner._id)) {
            httpErr = {
              status: 400,
              code: 'SELF_BOOKING_NOT_ALLOWED',
              message: 'You cannot book a mentorship session with yourself.'
            };
            throw new Error('ABORT_TX');
          }

          // Remove chosen slot from mentor availability if specified
          if (mentorProfile && chosenDate && chosenSlot) {
            const entry = mentorProfile.availability.find((a) => a.date === chosenDate);
            if (entry) {
              entry.slots = entry.slots.filter((s) => s !== chosenSlot);
              if (entry.slots.length === 0) {
                mentorProfile.availability = mentorProfile.availability.filter(
                  (a) => a.date !== chosenDate
                );
              }
              await mentorProfile.save({ session: dbSession });
            }
          }

          learner.credits -= sessionCost;
          await learner.save({ session: dbSession });
          remainingCredits = learner.credits;

          const [sessionDoc] = await Session.create(
            [
              {
                learnerId: learner._id,
                mentorId: resolvedMentorId || learner._id,
                status: 'PENDING',
                skillName,
                domain,
                scheduledTime: scheduledTime
                  ? new Date(scheduledTime)
                  : new Date(Date.now() + 3600000),
                bookedSlot: { date: chosenDate, slot: chosenSlot },
                creditsLocked: sessionCost
              }
            ],
            { session: dbSession }
          );
          createdSessionDoc = sessionDoc;

          await Transaction.create(
            [
              {
                userId: learner._id,
                sessionId: sessionDoc._id,
                type: 'ESCROW_LOCK',
                amount: -sessionCost,
                balanceAfter: learner.credits,
                description: `Locked ${sessionCost} CR in Escrow for ${skillName}`
              }
            ],
            { session: dbSession }
          );
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

      const io = req.app.get('io');
      const userSockets = req.app.get('userSockets');
      if (io && userSockets && userSockets.has(String(resolvedMentorId))) {
        const learnerProfile = await UserProfile.findOne({ userId: createdSessionDoc.learnerId });
        io.to(userSockets.get(String(resolvedMentorId))).emit('session-request', {
          sessionId: String(createdSessionDoc._id),
          learnerName: learnerProfile ? learnerProfile.displayName : 'Learner',
          skillName
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Session booked successfully. 50 Credits locked in Escrow.',
        session: {
          _id: String(createdSessionDoc._id),
          status: createdSessionDoc.status,
          skillName: createdSessionDoc.skillName,
          domain: createdSessionDoc.domain,
          mentorId: String(createdSessionDoc.mentorId),
          learnerId: String(createdSessionDoc.learnerId),
          bookedSlot: createdSessionDoc.bookedSlot,
          creditsLocked: createdSessionDoc.creditsLocked,
          learnerWalletRemaining: remainingCredits
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

    const resolvedMentorProfile = store.userProfiles.find(
      (p) =>
        String(p.userId) === String(mentorId) ||
        (mentorName && p.displayName.toLowerCase() === String(mentorName).toLowerCase())
    );
    const resolvedMentorId = resolvedMentorProfile
      ? resolvedMentorProfile.userId
      : mentorId || IDS.ALEX;

    if (String(resolvedMentorId) === String(learner._id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SELF_BOOKING_NOT_ALLOWED',
          httpStatus: 400,
          message: 'You cannot book a mentorship session with yourself.'
        }
      });
    }

    // Remove chosen slot from mentor's availability if provided
    if (resolvedMentorProfile && chosenDate && chosenSlot && Array.isArray(resolvedMentorProfile.availability)) {
      const entry = resolvedMentorProfile.availability.find((a) => a.date === chosenDate);
      if (entry && Array.isArray(entry.slots)) {
        entry.slots = entry.slots.filter((s) => s !== chosenSlot);
        if (entry.slots.length === 0) {
          resolvedMentorProfile.availability = resolvedMentorProfile.availability.filter(
            (a) => a.date !== chosenDate
          );
        }
      }
    }

    learner.credits -= sessionCost;

    let computedScheduledTime = scheduledTime ? new Date(scheduledTime) : new Date(Date.now() + 3600000);
    if (!scheduledTime && chosenDate && chosenSlot) {
      const startHour = chosenSlot.split('-')[0] || '14:00';
      const parsed = new Date(`${chosenDate}T${startHour}:00`);
      if (!Number.isNaN(parsed.getTime())) computedScheduledTime = parsed;
    }

    const newSession = {
      _id: generateId(),
      learnerId: String(learner._id),
      mentorId: String(resolvedMentorId),
      status: 'PENDING',
      skillName,
      domain,
      scheduledTime: computedScheduledTime,
      bookedSlot: { date: chosenDate, slot: chosenSlot },
      startedAt: null,
      completedAt: null,
      creditsLocked: sessionCost,
      meetingLink: 'https://meet.google.com/skillswap-live-room',
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
    await sweepExpiredPendingSessions();
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (isMongoConnected()) {
      const filter = isAdmin
        ? { status: { $in: ['PENDING', 'ACTIVE', 'DISPUTED'] } }
        : {
            $or: [{ learnerId: userId }, { mentorId: userId }],
            status: { $in: ['PENDING', 'ACTIVE', 'DISPUTED'] }
          };
      const sessions = await Session.find(filter).sort({ createdAt: -1 });

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
          (isAdmin ||
            String(s.learnerId) === String(userId) ||
            String(s.mentorId) === String(userId)) &&
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
    await sweepExpiredPendingSessions();
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (isMongoConnected()) {
      const filter = isAdmin
        ? { status: { $in: ['COMPLETED', 'CANCELLED', 'REFUNDED'] } }
        : {
            $or: [{ learnerId: userId }, { mentorId: userId }],
            status: { $in: ['COMPLETED', 'CANCELLED', 'REFUNDED'] }
          };
      const sessions = await Session.find(filter).sort({ completedAt: -1, updatedAt: -1 });
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
          (isAdmin ||
            String(s.learnerId) === String(userId) ||
            String(s.mentorId) === String(userId)) &&
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
      session.meetingLink = String(meetingLink).trim();
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
    session.meetingLink = String(meetingLink).trim();
    return res.status(200).json({ success: true, session: enrichSessionInMemory(session, store) });
  } catch (err) {
    next(err);
  }
};

// Feature #34, #37, #39: POST /api/sessions/:id/complete (with Mongoose Multi-Document ACID Transaction)
const completeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user.userId;
    const { rating = 5, comment = '' } = req.body || {};

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
              message: 'Session not found.'
            };
            throw new Error('ABORT_TX');
          }

          const isMentor = String(session.mentorId) === String(actorId);
          const isLearner = String(session.learnerId) === String(actorId);
          const check = validateStateTransition(
            session.status,
            'COMPLETED',
            req.user.role,
            isMentor,
            isLearner
          );
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

          const mentorProfile = await UserProfile.findOne({ userId: session.mentorId }).session(
            dbSession
          );
          if (mentorProfile) {
            const prevTotal = mentorProfile.totalSessions || 0;
            const prevRating = mentorProfile.rating || 5.0;
            const numRating = Math.min(5, Math.max(1, Number(rating) || 5));
            mentorProfile.totalSessions = prevTotal + 1;
            mentorProfile.rating = Number(
              ((prevRating * prevTotal + numRating) / (prevTotal + 1)).toFixed(1)
            );
            await mentorProfile.save({ session: dbSession });
          }

          session.status = 'COMPLETED';
          session.completedAt = new Date();
          session.feedback = {
            rating: Math.min(5, Math.max(1, Number(rating) || 5)),
            comment: String(comment).slice(0, 400),
            submittedAt: new Date()
          };
          await session.save({ session: dbSession });

          await Transaction.create(
            [
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
            ],
            { session: dbSession }
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
        message: `Session completed! ${settlementPayload.mentorCredited} Credits released to Mentor, ${settlementPayload.platformBurned} Credits burned.`,
        settlement: settlementPayload
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
      if (typeof mentorProfile.leaderboardSessions === 'number') {
        mentorProfile.leaderboardSessions += 1;
      }
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

// Feature #36: POST /api/sessions/:id/cancel (with Mongoose Multi-Document ACID Transaction)
const cancelSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user.userId;

    if (isMongoConnected()) {
      const dbSession = await mongoose.startSession();
      let updatedSessionDoc = null;
      let httpErr = null;

      try {
        await dbSession.withTransaction(async () => {
          const session = await Session.findById(id).session(dbSession);
          if (!session) {
            httpErr = {
              status: 404,
              code: 'SESSION_NOT_FOUND',
              message: 'Session not found.'
            };
            throw new Error('ABORT_TX');
          }

          const isMentor = String(session.mentorId) === String(actorId);
          const isLearner = String(session.learnerId) === String(actorId);
          const check = validateStateTransition(
            session.status,
            'CANCELLED',
            req.user.role,
            isMentor,
            isLearner
          );
          if (!check.valid) {
            httpErr = {
              status: check.status,
              code: check.code,
              message: check.message
            };
            throw new Error('ABORT_TX');
          }

          session.status = 'CANCELLED';
          await session.save({ session: dbSession });
          updatedSessionDoc = session;

          // Restore booked slot to mentor availability if present
          if (session.bookedSlot?.date && session.bookedSlot?.slot) {
            const mp = await UserProfile.findOne({ userId: session.mentorId }).session(dbSession);
            if (mp) {
              const entry = mp.availability.find((a) => a.date === session.bookedSlot.date);
              if (entry) {
                if (!entry.slots.includes(session.bookedSlot.slot)) {
                  entry.slots.push(session.bookedSlot.slot);
                }
              } else {
                mp.availability.push({
                  date: session.bookedSlot.date,
                  slots: [session.bookedSlot.slot]
                });
              }
              await mp.save({ session: dbSession });
            }
          }

          const learner = await User.findById(session.learnerId).session(dbSession);
          if (learner) {
            learner.credits += session.creditsLocked;
            await learner.save({ session: dbSession });
          }

          await Transaction.create(
            [
              {
                userId: session.learnerId,
                sessionId: session._id,
                type: 'REFUND',
                amount: session.creditsLocked,
                balanceAfter: learner ? learner.credits : null,
                description: `Escrow Refund (+${session.creditsLocked} CR) for cancelled session: ${session.skillName}`
              }
            ],
            { session: dbSession }
          );
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
        message: 'Session cancelled and 50 Credits refunded to Learner.',
        session: updatedSessionDoc
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

    // Restore booked slot to mentor availability if present
    if (session.bookedSlot?.date && session.bookedSlot?.slot) {
      const mp = store.userProfiles.find((p) => String(p.userId) === String(session.mentorId));
      if (mp) {
        if (!Array.isArray(mp.availability)) mp.availability = [];
        const entry = mp.availability.find((a) => a.date === session.bookedSlot.date);
        if (entry) {
          if (!entry.slots.includes(session.bookedSlot.slot)) {
            entry.slots.push(session.bookedSlot.slot);
          }
        } else {
          mp.availability.push({
            _id: generateId(),
            date: session.bookedSlot.date,
            slots: [session.bookedSlot.slot]
          });
        }
      }
    }

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

// Feature #45: POST /api/sessions/:id/chat (REST + Socket broadcast for live session workspace chat)
const sendSessionChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, messageText, senderName: customSenderName } = req.body || {};
    const rawText = text || messageText || '';

    if (!String(rawText).trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', httpStatus: 400, message: 'Message text is required.' }
      });
    }

    const cleanText = String(rawText).trim().slice(0, 2000);
    const senderId = req.user.userId;
    const roomName = `room:session_${id}`;

    if (isMongoConnected()) {
      const profile = await UserProfile.findOne({ userId: senderId });
      const senderName = customSenderName || (profile ? profile.displayName : req.user.email);
      const chatDoc = await ChatLog.create({
        sessionId: id,
        senderId,
        senderName,
        text: cleanText,
        timestamp: new Date()
      });

      const payload = {
        _id: String(chatDoc._id),
        sessionId: String(id),
        senderId: String(senderId),
        senderName,
        text: cleanText,
        messageText: cleanText,
        timestamp: chatDoc.timestamp
      };

      const io = req.app.get('io');
      if (io) {
        io.to(roomName).emit('new-message', payload);
      }

      return res.status(201).json({ success: true, message: payload });
    }

    const store = getStore();
    const profile = store.userProfiles.find((p) => String(p.userId) === String(senderId));
    const senderName = customSenderName || (profile ? profile.displayName : req.user.email);

    const newMsg = {
      _id: generateId(),
      sessionId: String(id),
      senderId: String(senderId),
      senderName,
      text: cleanText,
      messageText: cleanText,
      timestamp: new Date()
    };
    store.chatLogs.push(newMsg);

    const io = req.app.get('io');
    if (io) {
      io.to(roomName).emit('new-message', newMsg);
    }

    return res.status(201).json({ success: true, message: newMsg });
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
  getSessionChat,
  sendSessionChat,
  sweepExpiredPendingSessions
};
