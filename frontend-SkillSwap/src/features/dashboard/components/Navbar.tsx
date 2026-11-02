'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Wallet, ChevronDown, Shield, User as UserIcon, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
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
    <header
      className="navbar"
      style={{
        background: 'rgba(9, 9, 11, 0.88)',
        borderBottom: '1px solid var(--shadcn-border)',
        position: 'relative'
      }}
    >
      <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0, maxWidth: '520px' }}>
        {/* Mobile Hamburger Toggle Button */}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden navbar-toggle-btn"
            style={{ flexShrink: 0, color: 'var(--shadcn-fg)' }}
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </Button>
        )}

        {/* Global Search Bar */}
        <div className="search-bar" style={{ position: 'relative', width: '100%', minWidth: 0 }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--shadcn-muted-fg)',
              pointerEvents: 'none'
            }}
          />
          <Input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search skills, mentors, or domains..."
            style={{ paddingLeft: '36px', height: '38px', fontSize: '0.86rem' }}
          />
        </div>
      </div>

      <div className="nav-actions flex items-center gap-3">
        {/* Wallet Credit Pill -> Directs to /wallet */}
        <Link href="/wallet" style={{ textDecoration: 'none' }}>
          <Badge
            variant="emerald"
            className="navbar-credit-badge"
            style={{
              padding: '6px 12px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              gap: '6px'
            }}
            title={`Locked in Escrow: ${lockedInEscrow} CR. Click to view Virtual Wallet.`}
          >
            <Wallet size={14} />
            <span className="navbar-credit-text">{availableCredits} CR</span>
            {lockedInEscrow > 0 && (
              <span className="navbar-locked-text" style={{ color: '#fbbf24', marginLeft: '4px' }}>
                ({lockedInEscrow} Locked)
              </span>
            )}
          </Badge>
        </Link>

        {/* Authenticated User Profile Popover Menu */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            style={{
              background: '#121216',
              border: '1px solid var(--shadcn-border)',
              borderRadius: '9999px',
              padding: '4px 10px 4px 4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: 'var(--shadcn-fg)'
            }}
          >
            <Avatar style={{ height: '30px', width: '30px' }}>
              <AvatarFallback style={{ fontSize: '0.78rem', background: '#27272a' }}>
                {user.initials || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="navbar-user-info" style={{ textAlign: 'left', lineHeight: 1.15 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.displayName}</div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color:
                    user.role === 'ADMIN' ? 'var(--accent-amber)' : 'var(--accent-emerald-light)'
                }}
              >
                {user.role === 'ADMIN' ? 'SUPER ADMIN' : 'MEMBER'}
              </div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--shadcn-muted-fg)' }} />
          </button>

          {menuOpen && (
            <Card
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '250px',
                padding: '12px',
                zIndex: 100
              }}
            >
              <div style={{ padding: '4px 6px 10px' }}>
                <div className="font-bold text-sm">{user.displayName}</div>
                <div className="text-xs text-secondary">{user.email}</div>
              </div>

              <Separator style={{ marginBottom: '10px' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  style={{ textDecoration: 'none' }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <UserIcon size={14} /> My Profile
                  </Button>
                </Link>

                <Link
                  href="/wallet"
                  onClick={() => setMenuOpen(false)}
                  style={{ textDecoration: 'none' }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    style={{ justifyContent: 'flex-start', color: '#10b981' }}
                  >
                    <Wallet size={14} /> Virtual Wallet ({availableCredits} CR)
                  </Button>
                </Link>

                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin/disputes"
                    onClick={() => setMenuOpen(false)}
                    style={{ textDecoration: 'none' }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      style={{ justifyContent: 'flex-start', color: '#fbbf24' }}
                    >
                      <Shield size={14} /> Admin Console
                    </Button>
                  </Link>
                )}

                <Separator style={{ margin: '4px 0' }} />

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full"
                >
                  <LogOut size={14} /> Sign Out
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </header>
  );
}
