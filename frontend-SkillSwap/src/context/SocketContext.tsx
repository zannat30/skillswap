'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:5000';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshProfile } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [socketToast, setSocketToast] = useState<string | null>(null);

  useEffect(() => {
    const socketInstance = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      if (user?._id) {
        socketInstance.emit('register-user-socket', { userId: user._id });
      }
    });

    // Real-time Mentor Booking Notification (Section 13: session-request)
    socketInstance.on(
      'session-request',
      (payload: { sessionId: string; learnerName: string; skillName: string }) => {
        setSocketToast(
          `⚡ New Booking Request: ${payload.learnerName} booked "${payload.skillName}" (50 CR Locked in Escrow)`
        );
        refreshProfile();
      }
    );

    // Real-time 7-Day Streak Alert (Section 13: streak-alert)
    socketInstance.on(
      'streak-alert',
      (payload: { streakCount: number; bonusEligible: number }) => {
        if (payload?.streakCount >= 7) {
          // Non-intrusive notification when connecting with an eligible streak
        }
      }
    );

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?._id, refreshProfile]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
      {socketToast && (
        <div
          className="glass-panel"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 18px',
            borderRadius: '12px',
            borderColor: 'var(--accent-emerald)',
            color: 'var(--accent-emerald)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <span>{socketToast}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSocketToast(null)}
            style={{ fontSize: '1rem' }}
          >
            ×
          </button>
        </div>
      )}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
