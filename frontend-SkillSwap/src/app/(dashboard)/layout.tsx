'use client';

import React, { useEffect, useState } from 'react';
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Responsive Collapsible Sidebar */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="main-wrapper">
        <Navbar onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />
        <main id="app-view">{children}</main>
      </div>
    </div>
  );
}
