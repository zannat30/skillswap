'use client';

import React, { useState } from 'react';
import {
  Wallet,
  RefreshCw,
  Lock,
  ArrowUpRight,
  Flame,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Coins
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TransactionTable } from '@/features/wallet/components/TransactionTable';
import { apiRequest } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';

export default function WalletPage() {
  const {
    availableCredits,
    lockedInEscrow,
    profile,
    transactions,
    refreshProfile
  } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClaimingStreak, setIsClaimingStreak] = useState(false);
  const [claimStatus, setClaimStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClaimStreak = async () => {
    setIsClaimingStreak(true);
    setClaimStatus(null);
    try {
      const res = await apiRequest('/wallet/claim-streak', { method: 'POST' });
      if (res?.success) {
        setClaimStatus({
          type: 'success',
          text: res.message || 'Streak bonus claimed successfully!'
        });
        await refreshProfile();
      } else {
        setClaimStatus({
          type: 'error',
          text: res?.error?.message || 'Failed to claim streak bonus.'
        });
      }
    } catch (err: any) {
      setClaimStatus({
        type: 'error',
        text: err?.message || 'Failed to claim streak bonus.'
      });
    } finally {
      setIsClaimingStreak(false);
    }
  };

  const totalBalance = (availableCredits || 0) + (lockedInEscrow || 0);

  return (
    <div className="wallet-page" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Title & Top Action */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Virtual Credit Wallet
            </h1>
            <Badge variant="emerald" style={{ gap: '4px' }}>
              <Coins size={12} />
              <span>Zero-Cash Economy</span>
            </Badge>
          </div>
          <p className="text-sm text-secondary mt-1">
            90/10 Deflationary Escrow Settlement Ledger &amp; Real-time Credit Balances
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Ledger'}</span>
        </Button>
      </div>

      {claimStatus && (
        <Alert variant={claimStatus.type === 'success' ? 'emerald' : 'destructive'}>
          <div className="flex items-center gap-2">
            {claimStatus.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <AlertTitle>{claimStatus.type === 'success' ? 'Success' : 'Notice'}</AlertTitle>
          </div>
          <AlertDescription>{claimStatus.text}</AlertDescription>
        </Alert>
      )}

      {/* Credit Overview Stats */}
      <div
        className="wallet-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}
      >
        {/* Available Balance */}
        <Card style={{ background: '#09090b', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <CardContent style={{ padding: '20px' }}>
            <div className="flex-between">
              <span className="text-xs text-secondary uppercase font-bold tracking-wider">
                Available Balance
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Wallet className="text-emerald" size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-emerald">{availableCredits}</span>
              <span className="text-secondary font-semibold text-sm">CR</span>
            </div>
            <p className="text-xs text-secondary mt-2">
              Ready to spend on booking 60-min mentorship sessions (50 CR each).
            </p>
          </CardContent>
        </Card>

        {/* Locked in Escrow */}
        <Card style={{ background: '#09090b', borderColor: lockedInEscrow > 0 ? 'rgba(245, 158, 11, 0.4)' : 'var(--shadcn-border)' }}>
          <CardContent style={{ padding: '20px' }}>
            <div className="flex-between">
              <span className="text-xs text-secondary uppercase font-bold tracking-wider">
                Locked in Escrow
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Lock className="text-amber" size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-amber">{lockedInEscrow}</span>
              <span className="text-secondary font-semibold text-sm">CR</span>
            </div>
            <p className="text-xs text-secondary mt-2">
              Safely held in atomic escrow during pending or active sessions.
            </p>
          </CardContent>
        </Card>

        {/* Total Vault Balance */}
        <Card style={{ background: '#09090b' }}>
          <CardContent style={{ padding: '20px' }}>
            <div className="flex-between">
              <span className="text-xs text-secondary uppercase font-bold tracking-wider">
                Total Credit Value
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Coins style={{ color: '#818cf8' }} size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-white">{totalBalance}</span>
              <span className="text-secondary font-semibold text-sm">CR</span>
            </div>
            <p className="text-xs text-secondary mt-2">
              Combined sum of your liquid wallet credits and locked escrow deposits.
            </p>
          </CardContent>
        </Card>

        {/* Learning Streak & Milestone Bonus */}
        <Card style={{ background: '#09090b', borderColor: profile.streakBonusEligible ? 'rgba(16, 185, 129, 0.4)' : 'var(--shadcn-border)' }}>
          <CardContent style={{ padding: '20px' }}>
            <div className="flex-between">
              <span className="text-xs text-secondary uppercase font-bold tracking-wider">
                Learning Streak
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Flame style={{ color: '#f87171' }} size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-white">
                {profile.streakCount || 1}
              </span>
              <span className="text-secondary font-semibold text-sm">Days</span>
            </div>
            <div className="mt-2">
              {profile.streakBonusEligible ? (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleClaimStreak}
                  disabled={isClaimingStreak}
                  style={{ width: '100%', fontSize: '0.78rem' }}
                >
                  {isClaimingStreak ? 'Claiming...' : 'Claim +20 CR Milestone Bonus'}
                </Button>
              ) : (
                <p className="text-xs text-secondary">
                  Reach a 7-day streak to claim a +20 CR bonus!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 90/10 Deflationary Barter Mechanism Explainer Alert */}
      <Alert variant="emerald">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="text-emerald mt-0.5 flex-shrink-0" />
          <div>
            <AlertTitle className="text-emerald font-bold">
              Atomic 90/10 Deflationary Escrow Protocol
            </AlertTitle>
            <AlertDescription className="text-xs leading-relaxed opacity-90 mt-1">
              Every 60-minute session costs <strong>50 Credits</strong> locked atomically in Escrow.
              Upon mutual sign-off and completion, <strong>45 Credits (90%)</strong> are credited to
              the Mentor, and <strong>5 Credits (10%)</strong> are permanently burned from the money
              supply to prevent inflation. In case of no-shows or unresolved disputes, the Learner is
              guaranteed a <strong>full 50 CR refund</strong>.
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Transaction History Ledger Card */}
      <Card>
        <CardHeader
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--shadcn-border)',
            padding: '18px 24px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <CardTitle className="text-lg">Transaction Ledger</CardTitle>
            <CardDescription className="text-xs">
              Complete audit trail of all registration bonuses, escrow locks, releases, burns, and refunds.
            </CardDescription>
          </div>
          <Badge variant="outline">
            {transactions.length} Total Record{transactions.length === 1 ? '' : 's'}
          </Badge>
        </CardHeader>

        <CardContent style={{ padding: '0' }}>
          {transactions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Coins size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p className="text-sm">No transactions found in your escrow ledger yet.</p>
            </div>
          ) : (
            <div className="table-responsive-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
              <TransactionTable transactions={transactions} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

