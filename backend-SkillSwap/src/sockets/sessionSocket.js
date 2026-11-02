const ChatLog = require('../models/ChatLog');
const Session = require('../models/Session');
const User = require('../models/User');
const { isMongoConnected } = require('../config/db');
const { getStore, generateId, IDS } = require('../config/memoryStore');
const { resolveUserFromToken } = require('../middleware/authMiddleware');

const activeRoomTimers = new Map(); // sessionId -> { remainingSeconds, intervalId }

const formatMMSS = (seconds) => {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const s = (safe % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

/**
 * Gap 3: Verifies that the socket user is an authorized participant
 * (Learner, Mentor, or Admin) of the target session room.
 */
const verifySessionMember = async (sessionId, candidateUserId, userRole) => {
  if (!sessionId) {
    return { allowed: false, reason: 'Missing sessionId.' };
  }
  const effectiveUserId = String(candidateUserId || IDS.ZANNAT);

  let sessionDoc = null;
  if (isMongoConnected()) {
    sessionDoc = await Session.findById(sessionId).lean().catch(() => null);
  } else {
    sessionDoc = getStore().sessions.find((s) => String(s._id) === String(sessionId)) || null;
  }

  if (!sessionDoc) {
    return { allowed: false, reason: 'Session not found.' };
  }

  const isLearner = String(sessionDoc.learnerId) === effectiveUserId;
  const isMentor = String(sessionDoc.mentorId) === effectiveUserId;
  const isAdmin = userRole === 'ADMIN';

  if (!isLearner && !isMentor && !isAdmin) {
    return {
      allowed: false,
      reason: 'Access denied. Only the assigned Learner, Mentor, or an Admin can interact with this session room.'
    };
  }

  return {
    allowed: true,
    session: sessionDoc,
    userId: effectiveUserId,
    isLearner,
    isMentor,
    isAdmin
  };
};

const setupSessionSocket = (io, userSockets) => {
  // Handshake middleware: attach JWT user identity if token is provided
  io.use(async (socket, next) => {
    try {
      const rawToken =
        socket.handshake?.auth?.token ||
        (socket.handshake?.headers?.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.split(' ')[1]
          : null);

      if (rawToken) {
        const user = await resolveUserFromToken(rawToken);
        if (user && !user.isBanned) {
          socket.userId = String(user._id);
          socket.userRole = user.role || 'USER';
        }
      } else if (socket.handshake?.auth?.userId) {
        socket.userId = String(socket.handshake.auth.userId);
      }
    } catch (_) {
      // Allow connection and verify per-event
    }
    next();
  });

  io.on('connection', (socket) => {
    // 1. register-user-socket
    socket.on('register-user-socket', async ({ userId, token } = {}) => {
      if (token && !socket.userId) {
        const tokenUser = await resolveUserFromToken(token);
        if (tokenUser) {
          socket.userId = String(tokenUser._id);
          socket.userRole = tokenUser.role || 'USER';
        }
      }

      const resolvedId = socket.userId || (userId ? String(userId) : null);
      if (!resolvedId) return;

      socket.userId = resolvedId;
      userSockets.set(resolvedId, socket.id);

      // Emit streak-alert if user has >= 7 day streak
      let user = null;
      if (isMongoConnected()) {
        user = await User.findById(resolvedId).lean().catch(() => null);
      } else {
        user = getStore().users.find((u) => String(u._id) === resolvedId);
      }
      if (user) {
        socket.userRole = user.role || socket.userRole || 'USER';
        if ((user.streakCount || 0) >= 7) {
          socket.emit('streak-alert', {
            streakCount: user.streakCount,
            bonusEligible: 20
          });
        }
      }
    });

    // 2. join-session-room (Enforces Learner / Mentor / Admin room membership check)
    socket.on('join-session-room', async ({ sessionId, userId } = {}) => {
      if (!sessionId) return;
      const candidateUserId = socket.userId || userId || IDS.ZANNAT;
      const check = await verifySessionMember(sessionId, candidateUserId, socket.userRole);

      if (!check.allowed) {
        socket.emit('socket-error', {
          code: 'FORBIDDEN_ROOM_ACCESS',
          sessionId: String(sessionId),
          message: check.reason
        });
        return;
      }

      const roomName = `room:session_${sessionId}`;
      socket.join(roomName);
      socket.currentSessionRoom = roomName;

      // If timer already active, immediately sync client
      if (activeRoomTimers.has(String(sessionId))) {
        const timerObj = activeRoomTimers.get(String(sessionId));
        socket.emit('timer-update', {
          sessionId: String(sessionId),
          remainingSeconds: timerObj.remainingSeconds,
          formatted: formatMMSS(timerObj.remainingSeconds)
        });
      }
    });

    // 3. start-session-timer (Authoritative Server Countdown Broadcast)
    socket.on('start-session-timer', async ({ sessionId, userId, duration = 3600 } = {}) => {
      if (!sessionId) return;
      const candidateUserId = socket.userId || userId || IDS.ZANNAT;
      const check = await verifySessionMember(sessionId, candidateUserId, socket.userRole);

      if (!check.allowed) {
        socket.emit('socket-error', {
          code: 'FORBIDDEN_ROOM_ACCESS',
          sessionId: String(sessionId),
          message: check.reason
        });
        return;
      }

      const sid = String(sessionId);
      const roomName = `room:session_${sid}`;

      if (activeRoomTimers.has(sid)) {
        clearInterval(activeRoomTimers.get(sid).intervalId);
      }

      const timerState = {
        remainingSeconds: Number(duration) || 3600,
        intervalId: null
      };

      timerState.intervalId = setInterval(() => {
        timerState.remainingSeconds -= 1;

        io.to(roomName).emit('timer-update', {
          sessionId: sid,
          remainingSeconds: timerState.remainingSeconds,
          formatted: formatMMSS(timerState.remainingSeconds)
        });

        if (timerState.remainingSeconds <= 0) {
          clearInterval(timerState.intervalId);
          activeRoomTimers.delete(sid);
          io.to(roomName).emit('session-concluded', {
            sessionId: sid,
            reason: 'TIMER_EXPIRED'
          });
        }
      }, 1000);

      activeRoomTimers.set(sid, timerState);

      io.to(roomName).emit('timer-update', {
        sessionId: sid,
        remainingSeconds: timerState.remainingSeconds,
        formatted: formatMMSS(timerState.remainingSeconds)
      });
    });

    // 4. send-message & new-message (Enforces Learner / Mentor / Admin membership check)
    socket.on('send-message', async ({ sessionId, senderId, senderName, text } = {}) => {
      if (!sessionId || !text || !String(text).trim()) return;
      const candidateUserId = socket.userId || senderId || IDS.ZANNAT;
      const check = await verifySessionMember(sessionId, candidateUserId, socket.userRole);

      if (!check.allowed) {
        socket.emit('socket-error', {
          code: 'FORBIDDEN_ROOM_ACCESS',
          sessionId: String(sessionId),
          message: check.reason
        });
        return;
      }

      const sid = String(sessionId);
      const roomName = `room:session_${sid}`;

      const cleanText = String(text).trim().slice(0, 2000);
      const safeSenderName = senderName || 'Participant';
      const safeSenderId = check.userId;

      let savedMsg;
      if (isMongoConnected()) {
        const doc = await ChatLog.create({
          sessionId: sid,
          senderId: safeSenderId,
          senderName: safeSenderName,
          text: cleanText,
          messageText: cleanText,
          timestamp: new Date()
        });
        savedMsg = {
          _id: String(doc._id),
          sessionId: sid,
          senderId: String(doc.senderId),
          senderName: doc.senderName,
          text: doc.text,
          messageText: doc.text,
          timestamp: doc.timestamp
        };
      } else {
        savedMsg = {
          _id: generateId(),
          sessionId: sid,
          senderId: String(safeSenderId),
          senderName: safeSenderName,
          text: cleanText,
          messageText: cleanText,
          timestamp: new Date()
        };
        getStore().chatLogs.push(savedMsg);
      }

      io.to(roomName).emit('new-message', savedMsg);
    });

    // 5. manual end session (Enforces Learner / Mentor / Admin membership check)
    socket.on('end-session-manual', async ({ sessionId, userId } = {}) => {
      if (!sessionId) return;
      const candidateUserId = socket.userId || userId || IDS.ZANNAT;
      const check = await verifySessionMember(sessionId, candidateUserId, socket.userRole);

      if (!check.allowed) {
        socket.emit('socket-error', {
          code: 'FORBIDDEN_ROOM_ACCESS',
          sessionId: String(sessionId),
          message: check.reason
        });
        return;
      }

      const sid = String(sessionId);
      const roomName = `room:session_${sid}`;
      if (activeRoomTimers.has(sid)) {
        clearInterval(activeRoomTimers.get(sid).intervalId);
        activeRoomTimers.delete(sid);
      }
      io.to(roomName).emit('session-concluded', {
        sessionId: sid,
        reason: 'MANUAL_END'
      });
    });

    socket.on('disconnect', () => {
      if (socket.userId && userSockets.get(socket.userId) === socket.id) {
        userSockets.delete(socket.userId);
      }
    });
  });
};

module.exports = { setupSessionSocket, activeRoomTimers, verifySessionMember };
