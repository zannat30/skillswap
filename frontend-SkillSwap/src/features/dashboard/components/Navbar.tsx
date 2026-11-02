'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Wallet } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, availableCredits, searchQuery, setSearchQuery } = useAuth();

  const isMarketplaceActive =
    pathname === '/' || pathname.startsWith('/marketplace');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isMarketplaceActive && e.target.value.trim().length > 0) {
      router.push('/marketplace');
    }
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
        <Link href="/profile" className="credit-wallet">
          <Wallet />
          <span>{availableCredits} Credits</span>
        </Link>
        <Link href="/profile" className="user-profile">
          <div className="avatar">{user?.initials || 'Z'}</div>
        </Link>
      </div>
    </header>
  );
}
