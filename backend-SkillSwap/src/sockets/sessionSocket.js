const ChatLog = require('../models/ChatLog');
const { isMongoConnected } = require('../config/db');
const { getStore, generateId } = require('../config/memoryStore');

const activeRoomTimers = new Map(); // sessionId -> { remainingSeconds, intervalId }

const formatMMSS = (seconds) => {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const s = (safe % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const setupSessionSocket = (io, userSockets) => {
  io.on('connection', (socket) => {
    // 1. register-user-socket
    socket.on('register-user-socket', ({ userId } = {}) => {
      if (!userId) return;
      userSockets.set(String(userId), socket.id);
      socket.userId = String(userId);

      // Emit streak-alert if user has >= 7 day streak
      const store = getStore();
      const user = store.users.find((u) => String(u._id) === String(userId));
      if (user && (user.streakCount || 0) >= 7) {
        socket.emit('streak-alert', {
          streakCount: user.streakCount,
          bonusEligible: 20
        });
      }
    });

    // 2. join-session-room
    socket.on('join-session-room', ({ sessionId, userId } = {}) => {
      if (!sessionId) return;
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
    socket.on('start-session-timer', ({ sessionId, duration = 3600 } = {}) => {
      if (!sessionId) return;
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

    // 4. send-message & new-message
    socket.on('send-message', async ({ sessionId, senderId, senderName, text } = {}) => {
      if (!sessionId || !text || !String(text).trim()) return;
      const sid = String(sessionId);
      const roomName = `room:session_${sid}`;

      const cleanText = String(text).trim().slice(0, 2000);
      const safeSenderName = senderName || 'Participant';
      const safeSenderId = senderId || socket.userId || '664f1a2b3c4d5e6f7a8b9c01';

      let savedMsg;
      if (isMongoConnected()) {
        const doc = await ChatLog.create({
          sessionId: sid,
          senderId: safeSenderId,
          senderName: safeSenderName,
          text: cleanText,
          timestamp: new Date()
        });
        savedMsg = {
          _id: String(doc._id),
          sessionId: sid,
          senderId: String(doc.senderId),
          senderName: doc.senderName,
          text: doc.text,
          timestamp: doc.timestamp
        };
      } else {
        savedMsg = {
          _id: generateId(),
          sessionId: sid,
          senderId: String(safeSenderId),
          senderName: safeSenderName,
          text: cleanText,
          timestamp: new Date()
        };
        getStore().chatLogs.push(savedMsg);
      }

      io.to(roomName).emit('new-message', savedMsg);
    });

    // 5. manual end session
    socket.on('end-session-manual', ({ sessionId } = {}) => {
      if (!sessionId) return;
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

module.exports = { setupSessionSocket, activeRoomTimers };
