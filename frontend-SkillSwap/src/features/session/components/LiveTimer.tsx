'use client';

import React, { useEffect, useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';

interface LiveTimerProps {
  sessionId: string;
  isStopped?: boolean;
  onExpire?: () => void;
}

export function LiveTimer({ sessionId, isStopped = false, onExpire }: LiveTimerProps) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number>(3600);

  useEffect(() => {
    if (socket && sessionId) {
      socket.emit('join-session-room', { sessionId, userId: user?._id });

      const handleTimerUpdate = (payload: {
        sessionId: string;
        remainingSeconds: number;
      }) => {
        if (String(payload.sessionId) === String(sessionId)) {
          setTimeLeft(payload.remainingSeconds);
        }
      };

      const handleConcluded = (payload: { sessionId: string }) => {
        if (String(payload.sessionId) === String(sessionId) && onExpire) {
          onExpire();
        }
      };

      socket.on('timer-update', handleTimerUpdate);
      socket.on('session-concluded', handleConcluded);

      return () => {
        socket.off('timer-update', handleTimerUpdate);
        socket.off('session-concluded', handleConcluded);
      };
    }
  }, [socket, sessionId, user?._id, onExpire]);

  useEffect(() => {
    if (isStopped) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isStopped, onExpire]);

  const m = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <h3 className="ml-auto timer-display glowing-text" id="session-timer">
      {m}:{s}
    </h3>
  );
}
