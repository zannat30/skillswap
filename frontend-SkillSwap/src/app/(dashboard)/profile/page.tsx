'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { TransactionTable } from '@/features/wallet/components/TransactionTable';

export default function ProfilePage() {
  const { user, availableCredits, lockedInEscrow, transactions } = useAuth();

  return (
    <section className="view active">
      <h2>My Profile &amp; Wallet</h2>

      <div className="profile-grid mt-4">
        {/* Profile Card */}
        <div className="glass-panel p-6 border-radius-16">
          <div className="flex items-center gap-4 border-b border-glass pb-4 mb-4">
            <div
              className="avatar"
              style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}
            >
              {user?.initials || 'Z'}
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {user?.displayName || 'Zannat'}
              </h3>
              <p className="text-secondary">Joined Aug 2026</p>
            </div>
          </div>

          <h4 className="text-sm text-secondary uppercase tracking-wider mb-2">
            Skills I Have
          </h4>
          <div className="tags mb-4">
            <span className="tag tag-emerald">React.js (Expert)</span>
            <span className="tag tag-emerald">CSS (Intermediate)</span>
          </div>

          <h4 className="text-sm text-secondary uppercase tracking-wider mb-2">
            Skills I Want
          </h4>
          <div className="tags">
            <span className="tag tag-violet">Python</span>
            <span className="tag tag-violet">Machine Learning</span>
          </div>
        </div>

        {/* Wallet Dashboard */}
        <div className="glass-panel p-6 border-radius-16">
          <div className="flex-between mb-6">
            <div>
              <h3 className="text-lg font-bold">Virtual Credit Wallet</h3>
            </div>
            <div className="credit-balance">
              <span className="text-3xl font-bold text-emerald">
                {availableCredits}
              </span>
              <span className="text-secondary">CR</span>
            </div>
          </div>

          <div className="grid-stats mb-6">
            <div className="stat-box">
              <span className="text-secondary text-sm">Available Balance</span>
              <span className="font-bold text-lg text-emerald">
                {availableCredits}
              </span>
            </div>
            <div className="stat-box">
              <span className="text-secondary text-sm">Locked in Escrow</span>
              <span className="font-bold text-lg text-amber">
                {lockedInEscrow}
              </span>
            </div>
          </div>

          <h4 className="text-sm text-secondary uppercase tracking-wider mb-3">
            Transaction Ledger
          </h4>
          <TransactionTable transactions={transactions} />
        </div>
      </div>
    </section>
  );
}
