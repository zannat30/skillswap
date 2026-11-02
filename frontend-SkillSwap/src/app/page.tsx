'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Sparkles,
  Clock,
  LogIn,
  UserPlus,
  ArrowRight,
  Wallet,
  Code2,
  Palette,
  Languages,
  BookOpen,
  Repeat,
  Bot,
  Scale,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const { user, isLoadingAuth } = useAuth();
  const scrollAnimRef = useRef<number | null>(null);

  const cardBaseStyle: React.CSSProperties = {
    padding: '32px 28px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '18px',
    height: '100%'
  };

  const iconBoxStyle = (rgb: string): React.CSSProperties => ({
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: `rgba(${rgb}, 0.12)`,
    border: `1px solid rgba(${rgb}, 0.28)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  });

  const codePillStyle: React.CSSProperties = {
    background: 'rgba(30, 41, 59, 0.85)',
    border: '1px solid var(--border-glass)',
    padding: '2px 7px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    color: 'var(--text-primary)',
    fontFamily: 'monospace'
  };

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement>,
    targetId: string
  ) => {
    e.preventDefault();

    if (scrollAnimRef.current !== null) {
      window.cancelAnimationFrame(scrollAnimRef.current);
      scrollAnimRef.current = null;
    }

    const targetY =
      targetId === 'top'
        ? 0
        : (() => {
            const el = document.getElementById(targetId);
            if (!el) return 0;
            const headerOffset = 98;
            return el.getBoundingClientRect().top + window.scrollY - headerOffset;
          })();

    const startY = window.scrollY;
    const distance = targetY - startY;
    if (Math.abs(distance) < 2) return;

    const duration = 720;
    let startTime: number | null = null;

    // Starts fast immediately on click, glides smoothly to a soft stop at the end
    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

    const step = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuint(progress);
      window.scrollTo(0, startY + distance * eased);
      if (progress < 1) {
        scrollAnimRef.current = window.requestAnimationFrame(step);
      } else {
        scrollAnimRef.current = null;
      }
    };

    scrollAnimRef.current = window.requestAnimationFrame(step);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Fixed Top Landing Header (Always Frozen at Top on Scroll) */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 1000,
          height: '76px',
          borderBottom: '1px solid var(--border-glass)',
          background: 'rgba(11, 15, 25, 0.88)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div
          className="brand"
          onClick={(e) => handleSmoothScroll(e, 'top')}
          style={{ border: 'none', padding: 0, height: 'auto', cursor: 'pointer' }}
        >
          <div className="logo-box">S</div>
          <h2>
            Skill<span>Swap</span>
          </h2>
        </div>

        <nav
          className="flex items-center"
          style={{ gap: '28px', fontSize: '0.92rem', fontWeight: 500 }}
        >
          <a
            href="#how-it-works"
            onClick={(e) => handleSmoothScroll(e, 'how-it-works')}
            style={{ color: 'var(--text-secondary)', textDecoration: 'none', cursor: 'pointer' }}
          >
            How It Works
          </a>
          <a
            href="#architecture"
            onClick={(e) => handleSmoothScroll(e, 'architecture')}
            style={{ color: 'var(--text-secondary)', textDecoration: 'none', cursor: 'pointer' }}
          >
            Escrow Architecture
          </a>
          <a
            href="#domains"
            onClick={(e) => handleSmoothScroll(e, 'domains')}
            style={{ color: 'var(--text-secondary)', textDecoration: 'none', cursor: 'pointer' }}
          >
            Skill Domains
          </a>
        </nav>

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
              <Link href="/login" className="btn glass-btn" style={{ textDecoration: 'none' }}>
                <LogIn size={16} />
                <span>Sign In</span>
              </Link>
              <Link href="/register" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                <UserPlus size={16} />
                <span>Create Account (+100 CR)</span>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Scrollable Content (padded for 76px fixed top header) */}
      <main
        style={{
          flex: 1,
          maxWidth: '1220px',
          width: '100%',
          margin: '0 auto',
          padding: '136px 32px 100px',
          display: 'flex',
          flexDirection: 'column',
          gap: '96px'
        }}
      >
        {/* 1. HERO SECTION */}
        <section
          className="glass-card"
          style={{
            padding: '64px 44px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background:
              'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.14), rgba(15, 23, 42, 0.55) 70%)'
          }}
        >
          <div
            className="tag tag-emerald"
            style={{
              padding: '7px 16px',
              fontSize: '0.82rem',
              borderRadius: '9999px',
              marginBottom: '24px'
            }}
          >
            <Sparkles size={14} />
            <span>Decentralized Peer-to-Peer Knowledge Barter Economy</span>
          </div>

          <h1
            className="hero-title"
            style={{
              fontSize: '3.2rem',
              maxWidth: '840px',
              lineHeight: 1.15,
              marginBottom: '20px'
            }}
          >
            Trade Skills Instead of Money with{' '}
            <span className="text-gradient">Zero-Trust Escrow</span>
          </h1>

          <p
            className="hero-subtitle"
            style={{
              maxWidth: '670px',
              margin: '0 auto 36px',
              fontSize: '1.1rem',
              lineHeight: 1.7
            }}
          >
            Create a free account to receive <strong>100 Virtual Credits</strong> immediately. Book
            1-on-1 60-minute mentorship sessions for <strong>50 Credits</strong>, or teach your
            expertise to earn <strong>45 Credits</strong> per session.
          </p>

          <div
            className="flex items-center gap-4"
            style={{ flexWrap: 'wrap', justifyContent: 'center', marginBottom: '52px' }}
          >
            {!isLoadingAuth && user ? (
              <Link
                href={user.role === 'ADMIN' ? '/admin/disputes' : '/marketplace'}
                className="btn btn-primary"
                style={{
                  padding: '14px 30px',
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
                    padding: '14px 30px',
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
                    padding: '14px 30px',
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

          {/* Economy Metrics Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '20px',
              width: '100%'
            }}
          >
            <div
              className="glass-card"
              style={{
                padding: '24px 20px',
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.65)'
              }}
            >
              <div
                className="text-emerald font-bold"
                style={{ fontSize: '1.75rem', marginBottom: '6px' }}
              >
                +100 CR
              </div>
              <div className="text-xs text-secondary" style={{ lineHeight: 1.5 }}>
                Instant Onboarding Wallet Bonus
              </div>
            </div>
            <div
              className="glass-card"
              style={{
                padding: '24px 20px',
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.65)'
              }}
            >
              <div
                className="text-cyan font-bold"
                style={{ fontSize: '1.75rem', marginBottom: '6px' }}
              >
                50 CR
              </div>
              <div className="text-xs text-secondary" style={{ lineHeight: 1.5 }}>
                Fixed 60-Min Session Escrow Lock
              </div>
            </div>
            <div
              className="glass-card"
              style={{
                padding: '24px 20px',
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.65)'
              }}
            >
              <div
                className="text-emerald font-bold"
                style={{ fontSize: '1.75rem', marginBottom: '6px' }}
              >
                +45 CR (90%)
              </div>
              <div className="text-xs text-secondary" style={{ lineHeight: 1.5 }}>
                Released to Mentor on Completion
              </div>
            </div>
            <div
              className="glass-card"
              style={{
                padding: '24px 20px',
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.65)'
              }}
            >
              <div
                className="text-amber font-bold"
                style={{ fontSize: '1.75rem', marginBottom: '6px' }}
              >
                -5 CR (10%)
              </div>
              <div className="text-xs text-secondary" style={{ lineHeight: 1.5 }}>
                Deflationary Platform Fee Burn
              </div>
            </div>
          </div>
        </section>

        {/* 2. HOW IT WORKS (4-STEP WORKFLOW) */}
        <section id="how-it-works">
          <div className="text-center" style={{ marginBottom: '44px' }}>
            <span
              className="tag tag-cyan"
              style={{ padding: '6px 16px', borderRadius: '9999px', fontSize: '0.8rem' }}
            >
              Step-by-Step Protocol
            </span>
            <h2
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                marginTop: '16px',
                marginBottom: '12px'
              }}
            >
              How the <span className="text-gradient">Zero-Trust Barter Lifecycle</span> Works
            </h2>
            <p
              className="text-secondary"
              style={{ maxWidth: '620px', margin: '0 auto', lineHeight: 1.65, fontSize: '1rem' }}
            >
              No credit cards or cash required. Learn from peers and earn credits by teaching what
              you know.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))',
              gap: '24px'
            }}
          >
            <div className="glass-card" style={cardBaseStyle}>
              <div>
                <div className="flex-between" style={{ marginBottom: '22px' }}>
                  <span
                    className="tag tag-emerald"
                    style={{ padding: '5px 12px', fontWeight: 700, letterSpacing: '0.5px' }}
                  >
                    STEP 01
                  </span>
                  <div style={iconBoxStyle('16, 185, 129')}>
                    <UserPlus className="text-emerald" size={22} />
                  </div>
                </div>
                <h3
                  className="font-bold"
                  style={{ fontSize: '1.18rem', marginBottom: '12px', lineHeight: 1.35 }}
                >
                  Register &amp; Claim 100 CR
                </h3>
                <p className="text-secondary text-sm" style={{ lineHeight: 1.68 }}>
                  Sign up in seconds to receive <strong>100 Virtual Credits</strong> and list the
                  skills you can teach (<em>Skills I Have</em>) alongside skills you want to learn (
                  <em>Skills I Want</em>).
                </p>
              </div>
            </div>

            <div className="glass-card" style={cardBaseStyle}>
              <div>
                <div className="flex-between" style={{ marginBottom: '22px' }}>
                  <span
                    className="tag tag-cyan"
                    style={{ padding: '5px 12px', fontWeight: 700, letterSpacing: '0.5px' }}
                  >
                    STEP 02
                  </span>
                  <div style={iconBoxStyle('6, 182, 212')}>
                    <Repeat className="text-cyan" size={22} />
                  </div>
                </div>
                <h3
                  className="font-bold"
                  style={{ fontSize: '1.18rem', marginBottom: '12px', lineHeight: 1.35 }}
                >
                  Match &amp; Lock 50 CR Escrow
                </h3>
                <p className="text-secondary text-sm" style={{ lineHeight: 1.68 }}>
                  Discover verified mentors or bidirectional barter matches. Booking a time slot
                  atomically locks <strong>50 CR</strong> in the platform Escrow vault.
                </p>
              </div>
            </div>

            <div className="glass-card" style={cardBaseStyle}>
              <div>
                <div className="flex-between" style={{ marginBottom: '22px' }}>
                  <span
                    className="tag tag-violet"
                    style={{ padding: '5px 12px', fontWeight: 700, letterSpacing: '0.5px' }}
                  >
                    STEP 03
                  </span>
                  <div style={iconBoxStyle('139, 92, 246')}>
                    <Clock style={{ color: '#a78bfa' }} size={22} />
                  </div>
                </div>
                <h3
                  className="font-bold"
                  style={{ fontSize: '1.18rem', marginBottom: '12px', lineHeight: 1.35 }}
                >
                  60-Min Live Session Room
                </h3>
                <p className="text-secondary text-sm" style={{ lineHeight: 1.68 }}>
                  Collaborate inside an isolated Socket.io workspace with an authoritative{' '}
                  <strong>60:00 countdown timer</strong>, persistent chat, and video meeting link.
                </p>
              </div>
            </div>

            <div className="glass-card" style={cardBaseStyle}>
              <div>
                <div className="flex-between" style={{ marginBottom: '22px' }}>
                  <span
                    className="tag tag-amber"
                    style={{ padding: '5px 12px', fontWeight: 700, letterSpacing: '0.5px' }}
                  >
                    STEP 04
                  </span>
                  <div style={iconBoxStyle('245, 158, 11')}>
                    <CheckCircle2 className="text-amber" size={22} />
                  </div>
                </div>
                <h3
                  className="font-bold"
                  style={{ fontSize: '1.18rem', marginBottom: '12px', lineHeight: 1.35 }}
                >
                  90/10 Settlement or Refund
                </h3>
                <p className="text-secondary text-sm" style={{ lineHeight: 1.68 }}>
                  Upon completion, <strong>45 CR</strong> goes to the Mentor and{' '}
                  <strong>5 CR</strong> is burned. If an issue arises, raise a dispute for Admin
                  arbitration &amp; full <strong>50 CR</strong> refund protection.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CORE ARCHITECTURE HIGHLIGHTS */}
        <section id="architecture">
          <div className="text-center" style={{ marginBottom: '44px' }}>
            <span
              className="tag tag-emerald"
              style={{ padding: '6px 16px', borderRadius: '9999px', fontSize: '0.8rem' }}
            >
              System Architecture
            </span>
            <h2
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                marginTop: '16px',
                marginBottom: '12px'
              }}
            >
              Built for <span className="text-gradient">Security, Fairness &amp; Speed</span>
            </h2>
            <p
              className="text-secondary"
              style={{ maxWidth: '620px', margin: '0 auto', lineHeight: 1.65, fontSize: '1rem' }}
            >
              Every credit transfer, session room, and domain check is enforced by strict server-side
              guarantees.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))',
              gap: '24px'
            }}
          >
            <div className="glass-card" style={cardBaseStyle}>
              <div>
                <div style={{ ...iconBoxStyle('16, 185, 129'), marginBottom: '20px' }}>
                  <Wallet className="text-emerald" size={24} />
                </div>
                <h3
                  className="font-bold"
                  style={{ fontSize: '1.18rem', marginBottom: '12px', lineHeight: 1.35 }}
                >
                  Atomic 90/10 Escrow Engine
                </h3>
                <p className="text-secondary text-sm" style={{ lineHeight: 1.68 }}>
                  Multi-document MongoDB ACID transactions guarantee zero double-spending.
                  Unaccepted <code style={codePillStyle}>PENDING</code> bookings automatically
                  self-cancel after 24 hours and refund <strong>+50 CR</strong> to the Learner.
                </p>
              </div>
            </div>

            <div className="glass-card" style={cardBaseStyle}>
              <div>
                <div style={{ ...iconBoxStyle('6, 182, 212'), marginBottom: '20px' }}>
                  <Clock className="text-cyan" size={24} />
                </div>
                <h3
                  className="font-bold"
                  style={{ fontSize: '1.18rem', marginBottom: '12px', lineHeight: 1.35 }}
                >
                  Verified Socket.io Rooms
                </h3>
                <p className="text-secondary text-sm" style={{ lineHeight: 1.68 }}>
                  Strict JWT handshake and participant verification ensure only the booked Learner
                  and Mentor can join a session room, exchange live messages, and synchronize timers.
                </p>
              </div>
            </div>

            <div className="glass-card" style={cardBaseStyle}>
              <div>
                <div style={{ ...iconBoxStyle('139, 92, 246'), marginBottom: '20px' }}>
                  <Bot style={{ color: '#a78bfa' }} size={24} />
                </div>
                <h3
                  className="font-bold"
                  style={{ fontSize: '1.18rem', marginBottom: '12px', lineHeight: 1.35 }}
                >
                  Gemini AI SkillBot &amp; Roadmaps
                </h3>
                <p className="text-secondary text-sm" style={{ lineHeight: 1.68 }}>
                  Ask technical questions 24/7, generate structured 4-week study roadmaps, and get
                  matched with verified peer mentors inside the SkillSwap marketplace.
                </p>
              </div>
            </div>

            <div className="glass-card" style={cardBaseStyle}>
              <div>
                <div style={{ ...iconBoxStyle('245, 158, 11'), marginBottom: '20px' }}>
                  <Scale className="text-amber" size={24} />
                </div>
                <h3
                  className="font-bold"
                  style={{ fontSize: '1.18rem', marginBottom: '12px', lineHeight: 1.35 }}
                >
                  Admin Arbitration &amp; 403 Guard
                </h3>
                <p className="text-secondary text-sm" style={{ lineHeight: 1.68 }}>
                  Automated <code style={codePillStyle}>403 FORBIDDEN_DOMAIN</code> boundary
                  filtering blocks academic fraud and prohibited services, backed by Super Admin
                  dispute resolution.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. PERMITTED SKILL DOMAINS */}
        <section id="domains">
          <div className="text-center" style={{ marginBottom: '44px' }}>
            <span
              className="tag tag-violet"
              style={{ padding: '6px 16px', borderRadius: '9999px', fontSize: '0.8rem' }}
            >
              Verified Categories
            </span>
            <h2
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                marginTop: '16px',
                marginBottom: '12px'
              }}
            >
              Permitted <span className="text-gradient">Knowledge Domains</span>
            </h2>
            <p
              className="text-secondary"
              style={{ maxWidth: '620px', margin: '0 auto', lineHeight: 1.65, fontSize: '1rem' }}
            >
              Protected by automated domain boundary enforcement to ensure ethical peer learning.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))',
              gap: '24px'
            }}
          >
            <div className="glass-card" style={cardBaseStyle}>
              <div>
                <div style={{ ...iconBoxStyle('16, 185, 129'), marginBottom: '20px' }}>
                  <Code2 className="text-emerald" size={24} />
                </div>
                <h3
                  className="font-bold"
                  style={{ fontSize: '1.18rem', marginBottom: '12px', lineHeight: 1.35 }}
                >
                  Technology &amp; Engineering
                </h3>
                <p className="text-secondary text-sm" style={{ lineHeight: 1.68 }}>
                  React.js, Next.js, Node.js, Python, System Design, Data Structures, Cloud &amp;
                  DevOps.
                </p>
              </div>
              <div className="tags" style={{ marginTop: '8px' }}>
                <span className="tag tag-emerald">React.js</span>
                <span className="tag tag-emerald">Node.js</span>
                <span className="tag tag-emerald">Python</span>
              </div>
            </div>

            <div className="glass-card" style={cardBaseStyle}>
              <div>
                <div style={{ ...iconBoxStyle('6, 182, 212'), marginBottom: '20px' }}>
                  <Palette className="text-cyan" size={24} />
                </div>
                <h3
                  className="font-bold"
                  style={{ fontSize: '1.18rem', marginBottom: '12px', lineHeight: 1.35 }}
                >
                  Creative Arts &amp; Design
                </h3>
                <p className="text-secondary text-sm" style={{ lineHeight: 1.68 }}>
                  Figma UI/UX Prototyping, Design Systems, Motion Graphics, 3D Modeling &amp; Digital
                  Illustration.
                </p>
              </div>
              <div className="tags" style={{ marginTop: '8px' }}>
                <span className="tag tag-cyan">Figma UI/UX</span>
                <span className="tag tag-cyan">3D &amp; Motion</span>
              </div>
            </div>

            <div className="glass-card" style={cardBaseStyle}>
              <div>
                <div style={{ ...iconBoxStyle('245, 158, 11'), marginBottom: '20px' }}>
                  <Languages className="text-amber" size={24} />
                </div>
                <h3
                  className="font-bold"
                  style={{ fontSize: '1.18rem', marginBottom: '12px', lineHeight: 1.35 }}
                >
                  Global Languages
                </h3>
                <p className="text-secondary text-sm" style={{ lineHeight: 1.68 }}>
                  Conversational Japanese, Spanish, English Fluency, IELTS Speaking Practice &amp;
                  Technical Writing.
                </p>
              </div>
              <div className="tags" style={{ marginTop: '8px' }}>
                <span className="tag tag-amber">Japanese</span>
                <span className="tag tag-amber">IELTS &amp; English</span>
              </div>
            </div>

            <div className="glass-card" style={cardBaseStyle}>
              <div>
                <div style={{ ...iconBoxStyle('139, 92, 246'), marginBottom: '20px' }}>
                  <BookOpen style={{ color: '#a78bfa' }} size={24} />
                </div>
                <h3
                  className="font-bold"
                  style={{ fontSize: '1.18rem', marginBottom: '12px', lineHeight: 1.35 }}
                >
                  Academics &amp; STEM Concepts
                </h3>
                <p className="text-secondary text-sm" style={{ lineHeight: 1.68 }}>
                  Linear Algebra, Calculus, Physics Intuition, Statistics &amp; Research Methodology
                  Tutoring.
                </p>
              </div>
              <div className="tags" style={{ marginTop: '8px' }}>
                <span className="tag tag-violet">Calculus</span>
                <span className="tag tag-violet">Linear Algebra</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. BOTTOM CALL TO ACTION */}
        <section
          className="glass-card text-center"
          style={{
            padding: '56px 40px',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            background:
              'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div style={{ ...iconBoxStyle('16, 185, 129'), width: '60px', height: '60px', marginBottom: '20px' }}>
            <ShieldCheck className="text-emerald" size={30} />
          </div>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: '14px' }}>
            Ready to Join the SkillSwap Barter Network?
          </h2>
          <p
            className="text-secondary"
            style={{
              maxWidth: '580px',
              margin: '0 auto 32px',
              fontSize: '1.02rem',
              lineHeight: 1.68
            }}
          >
            Authentication is required to browse mentors, view leaderboards, or book sessions.
            Create your free account now and get <strong>+100 Virtual Credits</strong> instantly.
          </p>
          <div className="flex items-center justify-center gap-4" style={{ flexWrap: 'wrap' }}>
            <Link
              href="/register"
              className="btn btn-primary"
              style={{ padding: '14px 30px', fontSize: '1rem', textDecoration: 'none' }}
            >
              <UserPlus size={18} />
              <span>Create Free Account (+100 CR)</span>
            </Link>
            <Link
              href="/login"
              className="btn glass-btn"
              style={{ padding: '14px 30px', fontSize: '1rem', textDecoration: 'none' }}
            >
              <LogIn size={18} />
              <span>Sign In</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-glass)',
          padding: '28px 32px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.88rem',
          background: 'rgba(11, 15, 25, 0.9)'
        }}
      >
        SkillSwap • Decentralized Peer-to-Peer Knowledge Exchange &amp; Virtual Credit Escrow
      </footer>
    </div>
  );
}
