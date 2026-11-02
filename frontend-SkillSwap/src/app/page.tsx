'use client';

import React from 'react';
import DashboardLayout from './(dashboard)/layout';
import MarketplacePage from './(dashboard)/marketplace/page';

export default function HomePage() {
  return (
    <DashboardLayout>
      <MarketplacePage />
    </DashboardLayout>
  );
}
