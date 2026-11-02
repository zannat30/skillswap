'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Sparkles,
  Clock,
  LogIn,
  UserPlus,
  ArrowRight,
  Wallet
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const { user, isLoadingAuth } = useAuth();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-obsidian)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Top Landing Header */}
      <header
        style={{
          height: '76px',
          borderBottom: '1px solid var(--border-glass)',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px'
        }}
      >
        <div className="brand" style={{ border: 'none', padding: 0, height: 'auto' }}>
          <div className="logo-box">S</div>
          <h2>
            Skill<span>Swap</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {!isLoadingAuth && user ? (
            <Link
              href={user.role === 'ADMIN' ? '/admin/disputes' : '/marketplace'}
              className="btn btn-primary"
              style={{ textDecoration: 'none' }}
            >
              <span>Go to Dashboard ({user.displayName})</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="btn glass-btn"
                style={{ textDecoration: 'none' }}
              >
                <LogIn size={16} />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="btn btn-primary"
                style={{ textDecoration: 'none' }}
              >
                <UserPlus size={16} />
                <span>Create Account (+100 CR)</span>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Hero & Feature Showcase */}
      <main
        style={{
          flex: 1,
          maxWidth: '1100px',
          width: '100%',
          margin: '0 auto',
          padding: '64px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}
      >
        <div
          className="tag tag-emerald mb-4"
          style={{
            padding: '6px 14px',
            fontSize: '0.8rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Sparkles size={14} />
          <span>Decentralized Peer-to-Peer Knowledge Barter Economy</span>
        </div>

        <h1
          className="hero-title"
          style={{ fontSize: '3rem', maxWidth: '780px', lineHeight: 1.15 }}
        >
          Trade Skills Instead of Money with{' '}
          <span className="text-gradient">Zero-Trust Escrow</span>
        </h1>

        <p
          className="hero-subtitle"
          style={{ maxWidth: '640px', margin: '18px auto 32px', fontSize: '1.08rem' }}
        >
          Create a free account to receive <strong>100 Virtual Credits</strong>. Book 1-on-1
          60-minute mentorship sessions for <strong>50 Credits</strong>, or teach your skills to
          earn <strong>45 Credits</strong> per session.
        </p>

        <div className="flex items-center gap-4" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          {!isLoadingAuth && user ? (
            <Link
              href={user.role === 'ADMIN' ? '/admin/disputes' : '/marketplace'}
              className="btn btn-primary"
              style={{
                padding: '14px 28px',
                fontSize: '1rem',
                textDecoration: 'none'
              }}
            >
              <span>Enter SkillSwap Workspace</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="btn btn-primary"
                style={{
                  padding: '14px 28px',
                  fontSize: '1rem',
                  textDecoration: 'none'
                }}
              >
                <UserPlus size={18} />
                <span>Create Account &amp; Claim 100 Credits</span>
              </Link>
              <Link
                href="/login"
                className="btn glass-btn"
                style={{
                  padding: '14px 28px',
                  fontSize: '1rem',
                  textDecoration: 'none'
                }}
              >
                <LogIn size={18} />
                <span>Sign In to Existing Account</span>
              </Link>
            </>
          )}
        </div>

        {/* Core Architecture Highlights */}
        <div
          className="mentors-grid mt-6"
          style={{
            width: '100%',
            marginTop: '56px',
            textAlign: 'left'
          }}
        >
          <div className="glass-panel p-6 border-radius-16">
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="text-emerald" size={22} />
              <h3 className="text-lg font-bold">Atomic 90/10 Escrow Engine</h3>
            </div>
            <p className="text-secondary text-sm">
              Every 60-minute session locks <strong>50 CR</strong> in an ACID-compliant Escrow
              vault. Upon completion, <strong>45 CR (90%)</strong> is released to the Mentor and{' '}
              <strong>5 CR (10%)</strong> is permanently burned to prevent inflation.
            </p>
          </div>

          <div className="glass-panel p-6 border-radius-16">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="text-cyan" size={22} />
              <h3 className="text-lg font-bold">Synchronized Live Workspace</h3>
            </div>
            <p className="text-secondary text-sm">
              Isolated Socket.io session rooms with an authoritative 60:00 server countdown timer,
              live chat transcript logging, and 24-hour auto-refund protection.
            </p>
          </div>

          <div className="glass-panel p-6 border-radius-16">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="text-amber" size={22} />
              <h3 className="text-lg font-bold">24/7 AI SkillBot &amp; Governance</h3>
            </div>
            <p className="text-secondary text-sm">
              Generate 4-week study roadmaps with SkillBot AI, discover bidirectional barter
              matches, and rely on Admin Dispute Arbitration &amp; <code>403 FORBIDDEN_DOMAIN</code>{' '}
              safeguards.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
