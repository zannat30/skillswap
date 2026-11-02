'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/features/dashboard/components/Sidebar';
import { Navbar } from '@/features/dashboard/components/Navbar';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      router.replace('/login');
    }
  }, [isLoadingAuth, user, router]);

  if (isLoadingAuth || !user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-obsidian)',
          color: 'var(--text-secondary)',
          fontSize: '0.95rem'
        }}
      >
        Verifying authentication session...
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar />
        <main id="app-view">{children}</main>
      </div>
    </div>
  );
}
