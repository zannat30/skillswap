'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  BookOpen,
  MessageSquare,
  User as UserIcon,
  Wallet,
  Trophy,
  ShieldAlert,
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { activeSessionsCount, availableCredits, user } = useAuth();

  const isMarketplaceActive = pathname.startsWith('/marketplace');
  const isSessionsActive = pathname.startsWith('/active-sessions');
  const isSkillbotActive = pathname.startsWith('/ai-skillbot');
  const isProfileActive = pathname.startsWith('/profile');
  const isWalletActive = pathname.startsWith('/wallet');
  const isLeaderboardActive = pathname.startsWith('/leaderboard');
  const isAdminActive = pathname.startsWith('/admin');

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside
      className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}
      style={{
        background: '#09090b',
        borderRight: '1px solid var(--shadcn-border)'
      }}
    >
      <div
        className="brand flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--shadcn-border)', width: '100%' }}
      >
        <Link
          href="/marketplace"
          onClick={handleNavClick}
          className="flex items-center gap-3"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div className="logo-box">S</div>
          <h2>
            Skill<span>Swap</span>
          </h2>
        </Link>

        {/* Mobile close drawer button */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden sidebar-close-btn"
            style={{ color: 'var(--shadcn-muted-fg)' }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </Button>
        )}
      </div>

      <nav className="sidebar-nav">
        <p className="nav-label">Main Menu</p>
        <Link
          href="/marketplace"
          onClick={handleNavClick}
          className={`nav-item ${isMarketplaceActive ? 'active' : ''}`}
        >
          <Compass size={18} />
          <span>Marketplace</span>
        </Link>
        <Link
          href="/active-sessions"
          onClick={handleNavClick}
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
          onClick={handleNavClick}
          className={`nav-item ${isSkillbotActive ? 'active' : ''}`}
        >
          <MessageSquare size={18} />
          <span>AI SkillBot</span>
        </Link>
        <Link
          href="/profile"
          onClick={handleNavClick}
          className={`nav-item ${isProfileActive ? 'active' : ''}`}
        >
          <UserIcon size={18} />
          <span>My Profile</span>
        </Link>
        <Link
          href="/wallet"
          onClick={handleNavClick}
          className={`nav-item ${isWalletActive ? 'active' : ''}`}
        >
          <Wallet size={18} />
          <span>Virtual Wallet</span>
          <Badge variant="emerald" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
            {availableCredits} CR
          </Badge>
        </Link>
        <Link
          href="/leaderboard"
          onClick={handleNavClick}
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
              onClick={handleNavClick}
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
