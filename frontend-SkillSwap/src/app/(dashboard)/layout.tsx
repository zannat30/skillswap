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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-obsidian)',
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
          gap: '12px',
          padding: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '18px',
              height: '18px',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              borderTopColor: '#10b981',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}
          />
          <span>Verifying authentication session...</span>
        </div>
        <button
          type="button"
          onClick={() => router.replace('/login')}
          style={{
            marginTop: '8px',
            background: 'transparent',
            border: 'none',
            color: 'var(--shadcn-muted-fg)',
            fontSize: '0.82rem',
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          Taking longer than expected? Click to Sign In
        </button>
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
