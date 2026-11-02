'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Transaction, ProfileData } from '@/types';
import { apiRequest } from '@/lib/apiClient';

interface AuthContextType {
  user: User;
  profile: ProfileData;
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
  logoutUser: () => Promise<void>;
  switchDemoAccount: (email: string, password?: string) => Promise<void>;
}

const DEFAULT_USER: User = {
  _id: '664f1a2b3c4d5e6f7a8b9c01',
  displayName: 'Zannat',
  initials: 'Z',
  email: 'zannat@ist.edu.bd',
  role: 'USER',
  credits: 50,
  streakCount: 7,
  createdAt: '2026-08-15T10:00:00.000Z'
};

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    _id: '665099aabbccddeeff009902',
    userId: '664f1a2b3c4d5e6f7a8b9c01',
    sessionId: '665099aabbccddeeff001122',
    type: 'ESCROW_LOCK',
    amount: -50,
    balanceAfter: 50,
    description: 'Locked 50 CR in Escrow (React.js Mentorship)',
    createdAt: '2026-08-16T10:00:00.000Z'
  },
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

const DEFAULT_PROFILE: ProfileData = {
  userId: '664f1a2b3c4d5e6f7a8b9c01',
  displayName: 'Zannat',
  initials: 'Z',
  email: 'zannat@ist.edu.bd',
  role: 'USER',
  bio: 'Full-Stack Web Developer passionate about React.js, Next.js, and learning Python & ML.',
  joinedAt: 'Aug 2026',
  credits: 50,
  availableCredits: 50,
  lockedInEscrow: 50,
  streakCount: 7,
  streakBonusEligible: true,
  rating: 4.9,
  totalSessions: 11,
  skillsHave: [
    { _id: '665000000000000000000001', skill: 'React.js', domain: 'Technology', level: 'EXPERT' },
    { _id: '665000000000000000000002', skill: 'CSS', domain: 'Technology', level: 'INTERMEDIATE' }
  ],
  skillsWant: [
    { _id: '665000000000000000000003', skill: 'Python', domain: 'Technology', level: 'BEGINNER' },
    { _id: '665000000000000000000004', skill: 'Machine Learning', domain: 'Technology', level: 'BEGINNER' }
  ],
  availability: [
    { _id: '665000000000000000000005', date: '2026-11-15', slots: ['18:00-19:00', '20:00-21:00'] }
  ],
  transactions: DEFAULT_TRANSACTIONS
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [token, setToken] = useState<string | null>(null);
  const [availableCredits, setAvailableCredits] = useState<number>(50);
  const [lockedInEscrow, setLockedInEscrow] = useState<number>(50);
  const [transactions, setTransactions] = useState<Transaction[]>(DEFAULT_TRANSACTIONS);
  const [activeSessionsCount, setActiveSessionsCount] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const refreshProfile = useCallback(async () => {
    try {
      const res = await apiRequest('/profile/me');
      if (res?.success && res.profile) {
        const p: ProfileData = {
          userId: res.profile.userId,
          displayName: res.profile.displayName || 'Zannat',
          initials: res.profile.initials || 'Z',
          email: res.profile.email || 'zannat@ist.edu.bd',
          role: res.profile.role || 'USER',
          bio: res.profile.bio || '',
          joinedAt: res.profile.joinedAt || 'Aug 2026',
          credits: res.profile.credits ?? 50,
          availableCredits: res.profile.availableCredits ?? res.profile.credits ?? 50,
          lockedInEscrow: res.profile.lockedInEscrow ?? 0,
          streakCount: res.profile.streakCount ?? 0,
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
    } catch (_) {
      // Fallback to local state if backend is starting up
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') return;
      const savedToken = localStorage.getItem('skillswap_token');
      if (savedToken) {
        setToken(savedToken);
        await refreshProfile();
        return;
      }

      // Auto-login as Zannat with a real JWT on first visit so all authenticated endpoints work seamlessly
      try {
        const loginRes = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: 'zannat@ist.edu.bd',
            password: 'StrongPassword123!'
          })
        });
        if (loginRes?.success && loginRes.token) {
          localStorage.setItem('skillswap_token', loginRes.token);
          setToken(loginRes.token);
        }
      } catch (_) {
        // Ignore if backend is offline
      }
      await refreshProfile();
    };

    initAuth();
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

  const logoutUser = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (_) {
      // Ignore error
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('skillswap_token');
    }
    setToken(null);
    await refreshProfile();
  };

  const switchDemoAccount = async (email: string, password = 'StrongPassword123!') => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res?.success && res.token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('skillswap_token', res.token);
      }
      setToken(res.token);
      await refreshProfile();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
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
        logoutUser,
        switchDemoAccount
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
