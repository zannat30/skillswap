'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  BookOpen,
  MessageSquare,
  User as UserIcon,
  Trophy
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Sidebar() {
  const pathname = usePathname();
  const { activeSessionsCount } = useAuth();

  const isMarketplaceActive =
    pathname === '/' || pathname.startsWith('/marketplace');
  const isSessionsActive = pathname.startsWith('/active-sessions');
  const isSkillbotActive = pathname.startsWith('/ai-skillbot');
  const isProfileActive = pathname.startsWith('/profile');
  const isLeaderboardActive = pathname.startsWith('/leaderboard');

  return (
    <aside className="sidebar">
      <Link href="/marketplace" className="brand">
        <div className="logo-box">S</div>
        <h2>
          Skill<span>Swap</span>
        </h2>
      </Link>
      <nav className="sidebar-nav">
        <p className="nav-label">Main Menu</p>
        <Link
          href="/marketplace"
          className={`nav-item ${isMarketplaceActive ? 'active' : ''}`}
        >
          <Compass />
          <span>Marketplace</span>
        </Link>
        <Link
          href="/active-sessions"
          className={`nav-item ${isSessionsActive ? 'active' : ''}`}
        >
          <BookOpen />
          <span>Active Sessions</span>
          <span className="badge">{activeSessionsCount}</span>
        </Link>
        <Link
          href="/ai-skillbot"
          className={`nav-item ${isSkillbotActive ? 'active' : ''}`}
        >
          <MessageSquare />
          <span>AI SkillBot</span>
        </Link>
        <Link
          href="/profile"
          className={`nav-item ${isProfileActive ? 'active' : ''}`}
        >
          <UserIcon />
          <span>My Profile</span>
        </Link>
        <Link
          href="/leaderboard"
          className={`nav-item ${isLeaderboardActive ? 'active' : ''}`}
        >
          <Trophy />
          <span>Leaderboard</span>
        </Link>
      </nav>
    </aside>
  );
}
