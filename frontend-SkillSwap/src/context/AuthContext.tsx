'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Transaction, ProfileData } from '@/types';
import { apiRequest } from '@/lib/apiClient';

interface AuthContextType {
  user: User | null;
  profile: ProfileData;
  token: string | null;
  isLoadingAuth: boolean;
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
  logoutUser: () => Promise<void>;
}

const EMPTY_PROFILE: ProfileData = {
  userId: '',
  displayName: '',
  initials: 'U',
  email: '',
  role: 'USER',
  bio: '',
  joinedAt: '',
  credits: 0,
  availableCredits: 0,
  lockedInEscrow: 0,
  streakCount: 0,
  streakBonusEligible: false,
  rating: 5.0,
  totalSessions: 0,
  skillsHave: [],
  skillsWant: [],
  availability: [],
  transactions: []
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [availableCredits, setAvailableCredits] = useState<number>(0);
  const [lockedInEscrow, setLockedInEscrow] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeSessionsCount, setActiveSessionsCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const clearSessionState = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('skillswap_token');
    }
    setToken(null);
    setUser(null);
    setProfile(EMPTY_PROFILE);
    setAvailableCredits(0);
    setLockedInEscrow(0);
    setTransactions([]);
    setActiveSessionsCount(0);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (typeof window !== 'undefined' && !localStorage.getItem('skillswap_token')) {
      clearSessionState();
      return;
    }

    try {
      const res = await apiRequest('/profile/me');
      if (res?.success && res.profile) {
        const p: ProfileData = {
          userId: res.profile.userId,
          displayName: res.profile.displayName || 'User',
          initials: res.profile.initials || 'U',
          email: res.profile.email || '',
          role: res.profile.role || 'USER',
          bio: res.profile.bio || '',
          joinedAt: res.profile.joinedAt || 'Just now',
          credits: res.profile.credits ?? 0,
          availableCredits: res.profile.availableCredits ?? res.profile.credits ?? 0,
          lockedInEscrow: res.profile.lockedInEscrow ?? 0,
          streakCount: res.profile.streakCount ?? 1,
          streakBonusEligible: Boolean(res.profile.streakBonusEligible),
          rating: res.profile.rating ?? 5.0,
          totalSessions: res.profile.totalSessions ?? 0,
          skillsHave: Array.isArray(res.profile.skillsHave) ? res.profile.skillsHave : [],
          skillsWant: Array.isArray(res.profile.skillsWant) ? res.profile.skillsWant : [],
          availability: Array.isArray(res.profile.availability) ? res.profile.availability : [],
          transactions: Array.isArray(res.profile.transactions) ? res.profile.transactions : []
        };

        setProfile(p);
        setUser({
          _id: p.userId,
          displayName: p.displayName,
          initials: p.initials,
          email: p.email,
          role: p.role,
          credits: p.availableCredits,
          streakCount: p.streakCount,
          createdAt: p.joinedAt
        });
        setAvailableCredits(p.availableCredits);
        setLockedInEscrow(p.lockedInEscrow);
        setTransactions(p.transactions);
      }

      const activeRes = await apiRequest('/sessions/active');
      if (activeRes?.success && Array.isArray(activeRes.sessions)) {
        setActiveSessionsCount(activeRes.sessions.length);
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.code === 'TOKEN_EXPIRED_OR_MISSING') {
        clearSessionState();
      }
    }
  }, [clearSessionState]);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') {
        setIsLoadingAuth(false);
        return;
      }

      const savedToken = localStorage.getItem('skillswap_token');
      if (!savedToken) {
        clearSessionState();
        setIsLoadingAuth(false);
        return;
      }

      try {
        setToken(savedToken);
        await refreshProfile();
      } catch (err) {
        console.error('Failed to restore authentication session:', err);
        clearSessionState();
      } finally {
        setIsLoadingAuth(false);
      }
    };

    initAuth();
  }, [refreshProfile, clearSessionState]);

  const setCredits = (available: number, locked?: number) => {
    setAvailableCredits(available);
    setUser((prev) => (prev ? { ...prev, credits: available } : prev));
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

  const logoutUser = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (_) {
      // Ignore error
    }
    clearSessionState();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isLoadingAuth,
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
