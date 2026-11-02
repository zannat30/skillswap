'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Transaction } from '@/types';
import { apiRequest } from '@/lib/apiClient';

interface AuthContextType {
  user: User;
  token: string | null;
  availableCredits: number;
  lockedInEscrow: number;
  transactions: Transaction[];
  activeSessionsCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setCredits: (available: number, locked?: number) => void;
  addLocalTransaction: (tx: Transaction) => void;
  refreshProfile: () => Promise<void>;
  loginUser: (token: string, user: User) => void;
  logoutUser: () => void;
}

const DEFAULT_USER: User = {
  _id: '664f1a2b3c4d5e6f7a8b9c01',
  displayName: 'Zannat',
  initials: 'Z',
  email: 'zannat@ist.edu.bd',
  role: 'USER',
  credits: 100,
  streakCount: 7,
  createdAt: '2026-08-15T10:00:00.000Z'
};

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    _id: '665099aabbccddeeff009901',
    userId: '664f1a2b3c4d5e6f7a8b9c01',
    sessionId: null,
    type: 'BONUS',
    amount: 100,
    balanceAfter: 100,
    description: 'Registration Bonus',
    createdAt: '2026-08-15T10:00:00.000Z'
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [token, setToken] = useState<string | null>(null);
  const [availableCredits, setAvailableCredits] = useState<number>(100);
  const [lockedInEscrow, setLockedInEscrow] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>(DEFAULT_TRANSACTIONS);
  const [activeSessionsCount, setActiveSessionsCount] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const refreshProfile = useCallback(async () => {
    try {
      const res = await apiRequest('/profile/me');
      if (res?.success && res.profile) {
        setUser({
          _id: res.profile.userId,
          displayName: res.profile.displayName,
          initials: res.profile.initials || 'Z',
          email: res.profile.email,
          role: res.profile.role || 'USER',
          credits: res.profile.credits,
          streakCount: res.profile.streakCount ?? 7,
          createdAt: res.profile.joinedAt
        });
        setAvailableCredits(res.profile.availableCredits ?? res.profile.credits ?? 100);
        setLockedInEscrow(res.profile.lockedInEscrow ?? 0);
        if (Array.isArray(res.profile.transactions) && res.profile.transactions.length > 0) {
          setTransactions(res.profile.transactions);
        }
      }

      const activeRes = await apiRequest('/sessions/active');
      if (activeRes?.success && Array.isArray(activeRes.sessions)) {
        setActiveSessionsCount(activeRes.sessions.length || 1);
      }
    } catch (_) {
      // Fallback to local state if backend is starting up
    }
  }, []);

  useEffect(() => {
    const savedToken =
      typeof window !== 'undefined' ? localStorage.getItem('skillswap_token') : null;
    if (savedToken) setToken(savedToken);
    refreshProfile();
  }, [refreshProfile]);

  const setCredits = (available: number, locked?: number) => {
    setAvailableCredits(available);
    setUser((prev) => ({ ...prev, credits: available }));
    if (locked !== undefined) setLockedInEscrow(locked);
  };

  const addLocalTransaction = (tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev]);
  };

  const loginUser = (newToken: string, loggedUser: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('skillswap_token', newToken);
    }
    setToken(newToken);
    setUser(loggedUser);
    setAvailableCredits(loggedUser.credits);
    refreshProfile();
  };

  const logoutUser = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('skillswap_token');
    }
    setToken(null);
    setUser(DEFAULT_USER);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        availableCredits,
        lockedInEscrow,
        transactions,
        activeSessionsCount,
        searchQuery,
        setSearchQuery,
        setCredits,
        addLocalTransaction,
        refreshProfile,
        loginUser,
        logoutUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
