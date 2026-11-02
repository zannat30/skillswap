'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Wallet, ChevronDown, UserCheck, Shield, LogIn, UserPlus, LogOut } from 'lucide-react';
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
    switchDemoAccount,
    logoutUser
  } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isMarketplaceActive =
    pathname === '/' || pathname.startsWith('/marketplace');

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

  const handleQuickSwitch = async (email: string, redirectPath?: string) => {
    setSwitching(true);
    try {
      await switchDemoAccount(email);
      setMenuOpen(false);
      if (redirectPath) {
        router.push(redirectPath);
      }
    } catch (_) {
      // Ignore if offline
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logoutUser();
    router.push('/login');
  };

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
        <Link href="/profile" className="credit-wallet" title={`Locked in Escrow: ${lockedInEscrow} CR`}>
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

        {/* Role / Account Switcher & Auth Menu */}
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
            <div className="avatar">{user?.initials || 'Z'}</div>
            <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                {user?.displayName || 'Zannat'}
              </div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color:
                    user?.role === 'ADMIN'
                      ? 'var(--accent-amber)'
                      : user?.email === 'alex.rivera@skillswap.io'
                        ? 'var(--accent-cyan)'
                        : 'var(--accent-emerald)'
                }}
              >
                {user?.role === 'ADMIN'
                  ? 'ADMIN ROLE'
                  : user?.email === 'alex.rivera@skillswap.io'
                    ? 'MENTOR VIEW'
                    : 'LEARNER / MENTOR'}
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
                width: '270px',
                padding: '12px',
                borderRadius: '14px',
                zIndex: 100,
                boxShadow: '0 16px 40px rgba(0,0,0,0.6)'
              }}
            >
              <p
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}
              >
                Switch Active Persona (JWT)
              </p>

              <button
                type="button"
                disabled={switching}
                onClick={() => handleQuickSwitch('zannat@ist.edu.bd')}
                className="btn glass-btn w-full"
                style={{
                  justifyContent: 'flex-start',
                  padding: '8px 10px',
                  marginBottom: '6px',
                  fontSize: '0.82rem',
                  borderColor:
                    user?.email === 'zannat@ist.edu.bd'
                      ? 'var(--accent-emerald)'
                      : 'var(--border-glass)'
                }}
              >
                <UserCheck size={15} className="text-emerald" />
                <span>Zannat (Learner / Peer)</span>
              </button>

              <button
                type="button"
                disabled={switching}
                onClick={() => handleQuickSwitch('alex.rivera@skillswap.io')}
                className="btn glass-btn w-full"
                style={{
                  justifyContent: 'flex-start',
                  padding: '8px 10px',
                  marginBottom: '6px',
                  fontSize: '0.82rem',
                  borderColor:
                    user?.email === 'alex.rivera@skillswap.io'
                      ? 'var(--accent-cyan)'
                      : 'var(--border-glass)'
                }}
              >
                <UserCheck size={15} style={{ color: 'var(--accent-cyan)' }} />
                <span>Alex Rivera (Mentor)</span>
              </button>

              <button
                type="button"
                disabled={switching}
                onClick={() => handleQuickSwitch('admin@skillswap.io', '/admin/disputes')}
                className="btn glass-btn w-full"
                style={{
                  justifyContent: 'flex-start',
                  padding: '8px 10px',
                  marginBottom: '8px',
                  fontSize: '0.82rem',
                  borderColor:
                    user?.role === 'ADMIN'
                      ? 'var(--accent-amber)'
                      : 'var(--border-glass)'
                }}
              >
                <Shield size={15} className="text-amber" />
                <span>Platform Admin (Arbitrator)</span>
              </button>

              <hr className="glass-divider my-3" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="btn glass-btn w-full"
                  style={{
                    justifyContent: 'flex-start',
                    padding: '7px 10px',
                    fontSize: '0.8rem',
                    textDecoration: 'none'
                  }}
                >
                  My Profile &amp; Settings
                </Link>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="btn glass-btn w-full"
                    style={{
                      justifyContent: 'center',
                      padding: '7px 8px',
                      fontSize: '0.78rem',
                      textDecoration: 'none'
                    }}
                  >
                    <LogIn size={14} /> Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="btn glass-btn w-full"
                    style={{
                      justifyContent: 'center',
                      padding: '7px 8px',
                      fontSize: '0.78rem',
                      textDecoration: 'none'
                    }}
                  >
                    <UserPlus size={14} /> Register
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-danger w-full"
                  style={{
                    justifyContent: 'center',
                    padding: '7px 10px',
                    fontSize: '0.78rem'
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
