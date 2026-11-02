'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Wallet, ChevronDown, Shield, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    availableCredits,
    lockedInEscrow,
    searchQuery,
    setSearchQuery,
    logoutUser
  } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isMarketplaceActive = pathname.startsWith('/marketplace');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isMarketplaceActive && e.target.value.trim().length > 0) {
      router.push('/marketplace');
    }
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logoutUser();
    router.push('/');
  };

  if (!user) return null;

  return (
    <header className="navbar">
      <div className="search-bar">
        <Search className="search-icon" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search skills, mentors, or domains..."
        />
      </div>
      <div className="nav-actions">
        <Link
          href="/profile"
          className="credit-wallet"
          title={`Locked in Escrow: ${lockedInEscrow} CR`}
        >
          <Wallet />
          <span>{availableCredits} Credits</span>
          {lockedInEscrow > 0 && (
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--accent-amber)',
                marginLeft: '4px',
                opacity: 0.9
              }}
            >
              ({lockedInEscrow} Locked)
            </span>
          )}
        </Link>

        {/* Authenticated User Profile Menu */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="user-profile"
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border-glass)',
              borderRadius: '24px',
              padding: '4px 10px 4px 4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
          >
            <div className="avatar">{user.initials || 'U'}</div>
            <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                {user.displayName}
              </div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color:
                    user.role === 'ADMIN'
                      ? 'var(--accent-amber)'
                      : 'var(--accent-emerald)'
                }}
              >
                {user.role === 'ADMIN' ? 'SUPER ADMIN' : 'MEMBER'}
              </div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
          </button>

          {menuOpen && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '240px',
                padding: '12px',
                borderRadius: '14px',
                zIndex: 100,
                boxShadow: '0 16px 40px rgba(0,0,0,0.6)'
              }}
            >
              <div style={{ padding: '4px 6px 8px' }}>
                <div className="font-bold text-sm">{user.displayName}</div>
                <div className="text-xs text-secondary">{user.email}</div>
              </div>

              <hr className="glass-divider my-2" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="btn glass-btn w-full"
                  style={{
                    justifyContent: 'flex-start',
                    padding: '8px 10px',
                    fontSize: '0.8rem',
                    textDecoration: 'none'
                  }}
                >
                  <UserIcon size={14} /> My Profile &amp; Wallet
                </Link>

                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin/disputes"
                    onClick={() => setMenuOpen(false)}
                    className="btn glass-btn w-full"
                    style={{
                      justifyContent: 'flex-start',
                      padding: '8px 10px',
                      fontSize: '0.8rem',
                      textDecoration: 'none',
                      color: 'var(--accent-amber)'
                    }}
                  >
                    <Shield size={14} /> Admin Console
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-danger w-full"
                  style={{
                    justifyContent: 'center',
                    padding: '8px 10px',
                    fontSize: '0.8rem',
                    marginTop: '4px'
                  }}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
