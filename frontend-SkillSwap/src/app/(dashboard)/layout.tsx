'use client';

import React from 'react';
import { Sidebar } from '@/features/dashboard/components/Sidebar';
import { Navbar } from '@/features/dashboard/components/Navbar';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
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
