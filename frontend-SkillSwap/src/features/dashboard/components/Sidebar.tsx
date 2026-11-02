'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  BookOpen,
  MessageSquare,
  User as UserIcon,
  Trophy,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';

export function Sidebar() {
  const pathname = usePathname();
  const { activeSessionsCount, user } = useAuth();

  const isMarketplaceActive = pathname.startsWith('/marketplace');
  const isSessionsActive = pathname.startsWith('/active-sessions');
  const isSkillbotActive = pathname.startsWith('/ai-skillbot');
  const isProfileActive = pathname.startsWith('/profile');
  const isLeaderboardActive = pathname.startsWith('/leaderboard');
  const isAdminActive = pathname.startsWith('/admin');

  return (
    <aside
      className="sidebar"
      style={{
        background: '#09090b',
        borderRight: '1px solid var(--shadcn-border)'
      }}
    >
      <Link
        href="/marketplace"
        className="brand"
        style={{ borderBottom: '1px solid var(--shadcn-border)' }}
      >
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
          <Compass size={18} />
          <span>Marketplace</span>
        </Link>
        <Link
          href="/active-sessions"
          className={`nav-item ${isSessionsActive ? 'active' : ''}`}
        >
          <BookOpen size={18} />
          <span>Active Sessions</span>
          {activeSessionsCount > 0 && (
            <Badge variant="amber" style={{ marginLeft: 'auto' }}>
              {activeSessionsCount}
            </Badge>
          )}
        </Link>
        <Link
          href="/ai-skillbot"
          className={`nav-item ${isSkillbotActive ? 'active' : ''}`}
        >
          <MessageSquare size={18} />
          <span>AI SkillBot</span>
        </Link>
        <Link
          href="/profile"
          className={`nav-item ${isProfileActive ? 'active' : ''}`}
        >
          <UserIcon size={18} />
          <span>My Profile</span>
        </Link>
        <Link
          href="/leaderboard"
          className={`nav-item ${isLeaderboardActive ? 'active' : ''}`}
        >
          <Trophy size={18} />
          <span>Leaderboard</span>
        </Link>

        {user?.role === 'ADMIN' && (
          <>
            <p className="nav-label" style={{ marginTop: '20px' }}>
              Governance
            </p>
            <Link
              href="/admin/disputes"
              className={`nav-item ${isAdminActive ? 'active' : ''}`}
            >
              <ShieldAlert size={18} />
              <span>Admin Console</span>
              <Badge variant="amber" style={{ marginLeft: 'auto' }}>
                ADMIN
              </Badge>
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
