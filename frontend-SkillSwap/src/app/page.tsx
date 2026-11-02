'use client';

import React, { useRef, useState } from 'react';
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
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';

export default function LandingPage() {
  const { user, isLoadingAuth } = useAuth();
  const scrollAnimRef = useRef<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const iconBoxStyle = (rgb: string): React.CSSProperties => ({
    width: '46px',
    height: '46px',
    borderRadius: '10px',
    background: `rgba(${rgb}, 0.12)`,
    border: `1px solid rgba(${rgb}, 0.28)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  });

  const codePillStyle: React.CSSProperties = {
    background: '#18181b',
    border: '1px solid var(--shadcn-border)',
    padding: '2px 7px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    color: 'var(--shadcn-fg)',
    fontFamily: 'monospace'
  };

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement | HTMLButtonElement>,
    targetId: string
  ) => {
    e.preventDefault();
    setMobileMenuOpen(false);

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
            const headerOffset = 90;
            return el.getBoundingClientRect().top + window.scrollY - headerOffset;
          })();

    const startY = window.scrollY;
    const distance = targetY - startY;
    if (Math.abs(distance) < 2) return;

    const duration = 720;
    let startTime: number | null = null;

    // Fast start, smooth feather-soft stop at the end
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
        background: 'var(--shadcn-bg)',
        color: 'var(--shadcn-fg)',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden'
      }}
    >
      {/* Fixed Top shadcn/ui Header (Frozen at Top on Scroll) */}
      <header
        className="landing-header"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 1000,
          height: '72px',
          borderBottom: '1px solid var(--shadcn-border)',
          background: 'rgba(9, 9, 11, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px'
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

        {/* Desktop Navigation Links */}
        <nav className="landing-desktop-nav flex items-center" style={{ gap: '6px' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e: any) => handleSmoothScroll(e, 'how-it-works')}
          >
            How It Works
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e: any) => handleSmoothScroll(e, 'architecture')}
          >
            Escrow Architecture
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e: any) => handleSmoothScroll(e, 'domains')}
          >
            Skill Domains
          </Button>
        </nav>

        {/* Desktop Auth Actions */}
        <div className="landing-desktop-actions flex items-center gap-3">
          {!isLoadingAuth && user ? (
            <Link
              href={user.role === 'ADMIN' ? '/admin/disputes' : '/marketplace'}
              style={{ textDecoration: 'none' }}
            >
              <Button variant="default">
                <span>Dashboard ({user.displayName})</span>
                <ArrowRight size={16} />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <Button variant="outline">
                  <LogIn size={15} />
                  <span>Sign In</span>
                </Button>
              </Link>
              <Link href="/register" style={{ textDecoration: 'none' }}>
                <Button variant="default">
                  <UserPlus size={15} />
                  <span>Create Account (+100 CR)</span>
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="landing-mobile-toggle"
          style={{ color: 'var(--shadcn-fg)' }}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </Button>
      </header>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          className="landing-mobile-menu"
          style={{
            position: 'fixed',
            top: '72px',
            left: 0,
            right: 0,
            background: 'rgba(9, 9, 11, 0.98)',
            borderBottom: '1px solid var(--shadcn-border)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 999,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            style={{ justifyContent: 'flex-start' }}
            onClick={(e: any) => handleSmoothScroll(e, 'how-it-works')}
          >
            How It Works
          </Button>
          <Button
            variant="ghost"
            size="sm"
            style={{ justifyContent: 'flex-start' }}
            onClick={(e: any) => handleSmoothScroll(e, 'architecture')}
          >
            Escrow Architecture
          </Button>
          <Button
            variant="ghost"
            size="sm"
            style={{ justifyContent: 'flex-start' }}
            onClick={(e: any) => handleSmoothScroll(e, 'domains')}
          >
            Skill Domains
          </Button>

          <div style={{ height: '1px', background: 'var(--shadcn-border)', margin: '4px 0' }} />

          {!isLoadingAuth && user ? (
            <Link
              href={user.role === 'ADMIN' ? '/admin/disputes' : '/marketplace'}
              style={{ textDecoration: 'none' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Button variant="default" className="w-full">
                <span>Dashboard ({user.displayName})</span>
                <ArrowRight size={16} />
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                style={{ textDecoration: 'none' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button variant="outline" className="w-full">
                  <LogIn size={15} />
                  <span>Sign In</span>
                </Button>
              </Link>
              <Link
                href="/register"
                style={{ textDecoration: 'none' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button variant="default" className="w-full">
                  <UserPlus size={15} />
                  <span>Create Account (+100 CR Bonus)</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Main Scrollable Content */}
      <main
        className="landing-main"
        style={{
          flex: 1,
          maxWidth: '1220px',
          width: '100%',
          margin: '0 auto',
          padding: '110px 20px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: '80px'
        }}
      >
        {/* 1. HERO SECTION */}
        <Card
          className="hero-card"
          style={{
            padding: '56px 28px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background:
              'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.12), #0c0c0f 68%)'
          }}
        >
          <Badge variant="emerald" style={{ padding: '6px 14px', marginBottom: '20px' }}>
            <Sparkles size={13} />
            <span>Decentralized Peer-to-Peer Knowledge Barter Economy</span>
          </Badge>

          <h1
            className="hero-title"
            style={{
              maxWidth: '840px',
              lineHeight: 1.15,
              marginBottom: '20px',
              letterSpacing: '-0.03em'
            }}
          >
            Trade Skills Instead of Money with{' '}
            <span className="text-gradient">Zero-Trust Escrow</span>
          </h1>

          <p
            className="hero-subtitle"
            style={{
              maxWidth: '670px',
              margin: '0 auto 32px',
              lineHeight: 1.7
            }}
          >
            Create a free account to receive <strong>100 Virtual Credits</strong> immediately. Book
            1-on-1 60-minute mentorship sessions for <strong>50 Credits</strong>, or teach your
            expertise to earn <strong>45 Credits</strong> per session.
          </p>

          <div
            className="hero-cta-group flex items-center gap-4"
            style={{ flexWrap: 'wrap', justifyContent: 'center', marginBottom: '44px' }}
          >
            {!isLoadingAuth && user ? (
              <Link
                href={user.role === 'ADMIN' ? '/admin/disputes' : '/marketplace'}
                style={{ textDecoration: 'none' }}
              >
                <Button variant="default" size="lg">
                  <span>Enter SkillSwap Workspace</span>
                  <ArrowRight size={18} />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register" style={{ textDecoration: 'none' }}>
                  <Button variant="default" size="lg">
                    <UserPlus size={18} />
                    <span>Create Account &amp; Claim 100 Credits</span>
                  </Button>
                </Link>
                <Link href="/login" style={{ textDecoration: 'none' }}>
                  <Button variant="outline" size="lg">
                    <LogIn size={18} />
                    <span>Sign In to Existing Account</span>
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Economy Metrics Strip */}
          <div
            className="metrics-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              width: '100%'
            }}
          >
            <Card style={{ background: '#09090b', padding: '16px' }}>
              <span className="text-secondary text-xs uppercase font-bold tracking-wider">
                Starting Bonus
              </span>
              <div className="font-bold text-2xl text-emerald mt-1">+100 CR</div>
              <p className="text-xs text-secondary mt-1">Given to all verified accounts</p>
            </Card>

            <Card style={{ background: '#09090b', padding: '16px' }}>
              <span className="text-secondary text-xs uppercase font-bold tracking-wider">
                Session Escrow
              </span>
              <div className="font-bold text-2xl text-cyan mt-1">50 CR</div>
              <p className="text-xs text-secondary mt-1">Locked per 60-minute session</p>
            </Card>

            <Card style={{ background: '#09090b', padding: '16px' }}>
              <span className="text-secondary text-xs uppercase font-bold tracking-wider">
                Mentor Release
              </span>
              <div className="font-bold text-2xl text-violet mt-1">45 CR (90%)</div>
              <p className="text-xs text-secondary mt-1">Paid directly to mentor wallet</p>
            </Card>

            <Card style={{ background: '#09090b', padding: '16px' }}>
              <span className="text-secondary text-xs uppercase font-bold tracking-wider">
                Deflationary Burn
              </span>
              <div className="font-bold text-2xl text-amber mt-1">5 CR (10%)</div>
              <p className="text-xs text-secondary mt-1">Permanently removed from supply</p>
            </Card>
          </div>
        </Card>

        {/* 2. HOW IT WORKS */}
        <section id="how-it-works">
          <div className="text-center" style={{ marginBottom: '40px' }}>
            <Badge variant="cyan" style={{ padding: '5px 14px' }}>
              Step-by-Step Protocol
            </Badge>
            <h2
              className="section-title"
              style={{
                fontWeight: 800,
                marginTop: '16px',
                marginBottom: '12px',
                letterSpacing: '-0.02em'
              }}
            >
              How the <span className="text-gradient">Zero-Trust Barter Lifecycle</span> Works
            </h2>
            <p
              className="text-secondary section-desc"
              style={{ maxWidth: '620px', margin: '0 auto', lineHeight: 1.65 }}
            >
              No credit cards or cash required. Learn from peers and earn credits by teaching what
              you know.
            </p>
          </div>

          <div
            className="steps-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '18px'
            }}
          >
            <Card className="shadcn-card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
              <CardHeader>
                <div className="flex-between" style={{ marginBottom: '14px' }}>
                  <Badge variant="emerald">STEP 01</Badge>
                  <div style={iconBoxStyle('16, 185, 129')}>
                    <UserPlus className="text-emerald" size={20} />
                  </div>
                </div>
                <CardTitle>Register &amp; Claim 100 CR</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription style={{ lineHeight: 1.68 }}>
                  Sign up in seconds to receive <strong>100 Virtual Credits</strong> and list the
                  skills you can teach (<em>Skills I Have</em>) alongside skills you want to learn (
                  <em>Skills I Want</em>).
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadcn-card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
              <CardHeader>
                <div className="flex-between" style={{ marginBottom: '14px' }}>
                  <Badge variant="cyan">STEP 02</Badge>
                  <div style={iconBoxStyle('6, 182, 212')}>
                    <Repeat className="text-cyan" size={20} />
                  </div>
                </div>
                <CardTitle>Match &amp; Lock 50 CR Escrow</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription style={{ lineHeight: 1.68 }}>
                  Discover verified mentors or bidirectional barter matches. Booking a time slot
                  atomically locks <strong>50 CR</strong> in the platform Escrow vault.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadcn-card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
              <CardHeader>
                <div className="flex-between" style={{ marginBottom: '14px' }}>
                  <Badge variant="violet">STEP 03</Badge>
                  <div style={iconBoxStyle('139, 92, 246')}>
                    <Clock style={{ color: '#a78bfa' }} size={20} />
                  </div>
                </div>
                <CardTitle>60-Min Live Session Room</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription style={{ lineHeight: 1.68 }}>
                  Collaborate inside an isolated Socket.io workspace with an authoritative{' '}
                  <strong>60:00 countdown timer</strong>, persistent chat, and video meeting link.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadcn-card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
              <CardHeader>
                <div className="flex-between" style={{ marginBottom: '14px' }}>
                  <Badge variant="amber">STEP 04</Badge>
                  <div style={iconBoxStyle('245, 158, 11')}>
                    <CheckCircle2 className="text-amber" size={20} />
                  </div>
                </div>
                <CardTitle>90/10 Settlement or Refund</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription style={{ lineHeight: 1.68 }}>
                  Upon completion, <strong>45 CR</strong> goes to the Mentor and{' '}
                  <strong>5 CR</strong> is burned. If an issue arises, raise a dispute for Admin
                  arbitration &amp; full <strong>50 CR</strong> refund protection.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 3. CORE ARCHITECTURE HIGHLIGHTS */}
        <section id="architecture">
          <div className="text-center" style={{ marginBottom: '40px' }}>
            <Badge variant="emerald" style={{ padding: '5px 14px' }}>
              System Architecture
            </Badge>
            <h2
              className="section-title"
              style={{
                fontWeight: 800,
                marginTop: '16px',
                marginBottom: '12px',
                letterSpacing: '-0.02em'
              }}
            >
              Built for <span className="text-gradient">Security, Fairness &amp; Speed</span>
            </h2>
            <p
              className="text-secondary section-desc"
              style={{ maxWidth: '620px', margin: '0 auto', lineHeight: 1.65 }}
            >
              Every credit transfer, session room, and domain check is enforced by strict
              server-side guarantees.
            </p>
          </div>

          <div
            className="arch-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '18px'
            }}
          >
            <Card className="shadcn-card-hover">
              <CardHeader>
                <div style={{ ...iconBoxStyle('16, 185, 129'), marginBottom: '14px' }}>
                  <Wallet className="text-emerald" size={22} />
                </div>
                <CardTitle>Atomic 90/10 Escrow Engine</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription style={{ lineHeight: 1.68 }}>
                  Multi-document MongoDB ACID transactions guarantee zero double-spending.
                  Unaccepted <code style={codePillStyle}>PENDING</code> bookings automatically
                  self-cancel after 24 hours and refund <strong>+50 CR</strong> to the Learner.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadcn-card-hover">
              <CardHeader>
                <div style={{ ...iconBoxStyle('6, 182, 212'), marginBottom: '14px' }}>
                  <Clock className="text-cyan" size={22} />
                </div>
                <CardTitle>Verified Socket.io Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription style={{ lineHeight: 1.68 }}>
                  Strict JWT handshake and participant verification ensure only the booked Learner
                  and Mentor can join a session room, exchange live messages, and synchronize
                  timers.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadcn-card-hover">
              <CardHeader>
                <div style={{ ...iconBoxStyle('139, 92, 246'), marginBottom: '14px' }}>
                  <Bot style={{ color: '#a78bfa' }} size={22} />
                </div>
                <CardTitle>Gemini AI SkillBot &amp; Roadmaps</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription style={{ lineHeight: 1.68 }}>
                  Ask technical questions 24/7, generate structured 4-week study roadmaps, and get
                  matched with verified peer mentors inside the SkillSwap marketplace.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadcn-card-hover">
              <CardHeader>
                <div style={{ ...iconBoxStyle('245, 158, 11'), marginBottom: '14px' }}>
                  <Scale className="text-amber" size={22} />
                </div>
                <CardTitle>Admin Arbitration &amp; 403 Guard</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription style={{ lineHeight: 1.68 }}>
                  Automated <code style={codePillStyle}>403 FORBIDDEN_DOMAIN</code> boundary
                  filtering blocks academic fraud and prohibited services, backed by Super Admin
                  dispute resolution.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 4. PERMITTED SKILL DOMAINS */}
        <section id="domains">
          <div className="text-center" style={{ marginBottom: '40px' }}>
            <Badge variant="violet" style={{ padding: '5px 14px' }}>
              Verified Categories
            </Badge>
            <h2
              className="section-title"
              style={{
                fontWeight: 800,
                marginTop: '16px',
                marginBottom: '12px',
                letterSpacing: '-0.02em'
              }}
            >
              Permitted <span className="text-gradient">Knowledge Domains</span>
            </h2>
            <p
              className="text-secondary section-desc"
              style={{ maxWidth: '620px', margin: '0 auto', lineHeight: 1.65 }}
            >
              Protected by automated domain boundary enforcement to ensure ethical peer learning.
            </p>
          </div>

          <div
            className="domains-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '18px'
            }}
          >
            <Card
              className="shadcn-card-hover"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <CardHeader>
                  <div style={{ ...iconBoxStyle('16, 185, 129'), marginBottom: '14px' }}>
                    <Code2 className="text-emerald" size={22} />
                  </div>
                  <CardTitle>Technology &amp; Engineering</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription style={{ lineHeight: 1.68 }}>
                    React.js, Next.js, Node.js, Python, System Design, Data Structures, Cloud &amp;
                    DevOps.
                  </CardDescription>
                </CardContent>
              </div>
              <CardFooter style={{ gap: '8px', flexWrap: 'wrap' }}>
                <Badge variant="emerald">React.js</Badge>
                <Badge variant="emerald">Node.js</Badge>
                <Badge variant="emerald">Python</Badge>
              </CardFooter>
            </Card>

            <Card
              className="shadcn-card-hover"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <CardHeader>
                  <div style={{ ...iconBoxStyle('6, 182, 212'), marginBottom: '14px' }}>
                    <Palette className="text-cyan" size={22} />
                  </div>
                  <CardTitle>Creative Arts &amp; Design</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription style={{ lineHeight: 1.68 }}>
                    Figma UI/UX Prototyping, Design Systems, Motion Graphics, 3D Modeling &amp;
                    Digital Illustration.
                  </CardDescription>
                </CardContent>
              </div>
              <CardFooter style={{ gap: '8px', flexWrap: 'wrap' }}>
                <Badge variant="cyan">Figma UI/UX</Badge>
                <Badge variant="cyan">3D &amp; Motion</Badge>
              </CardFooter>
            </Card>

            <Card
              className="shadcn-card-hover"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <CardHeader>
                  <div style={{ ...iconBoxStyle('245, 158, 11'), marginBottom: '14px' }}>
                    <Languages className="text-amber" size={22} />
                  </div>
                  <CardTitle>Global Languages</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription style={{ lineHeight: 1.68 }}>
                    Conversational Japanese, Spanish, English Fluency, IELTS Speaking Practice &amp;
                    Technical Writing.
                  </CardDescription>
                </CardContent>
              </div>
              <CardFooter style={{ gap: '8px', flexWrap: 'wrap' }}>
                <Badge variant="amber">Japanese</Badge>
                <Badge variant="amber">IELTS &amp; English</Badge>
              </CardFooter>
            </Card>

            <Card
              className="shadcn-card-hover"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <CardHeader>
                  <div style={{ ...iconBoxStyle('139, 92, 246'), marginBottom: '14px' }}>
                    <BookOpen style={{ color: '#a78bfa' }} size={22} />
                  </div>
                  <CardTitle>Academics &amp; STEM Concepts</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription style={{ lineHeight: 1.68 }}>
                    Linear Algebra, Calculus, Physics Intuition, Statistics &amp; Research
                    Methodology Tutoring.
                  </CardDescription>
                </CardContent>
              </div>
              <CardFooter style={{ gap: '8px', flexWrap: 'wrap' }}>
                <Badge variant="violet">Calculus</Badge>
                <Badge variant="violet">Linear Algebra</Badge>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* 5. BOTTOM CALL TO ACTION */}
        <Card
          className="text-center"
          style={{
            padding: '48px 24px',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            background:
              'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, #0c0c0f 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              ...iconBoxStyle('16, 185, 129'),
              width: '56px',
              height: '56px',
              marginBottom: '20px'
            }}
          >
            <ShieldCheck className="text-emerald" size={28} />
          </div>
          <h2 className="section-title" style={{ fontWeight: 800, marginBottom: '12px' }}>
            Ready to Join the SkillSwap Barter Network?
          </h2>
          <p
            className="text-secondary section-desc"
            style={{
              maxWidth: '580px',
              margin: '0 auto 32px',
              lineHeight: 1.68
            }}
          >
            Authentication is required to browse mentors, view leaderboards, or book sessions.
            Create your free account now and get <strong>+100 Virtual Credits</strong> instantly.
          </p>
          <div className="flex items-center justify-center gap-4" style={{ flexWrap: 'wrap' }}>
            <Link href="/register" style={{ textDecoration: 'none' }}>
              <Button variant="default" size="lg">
                <UserPlus size={18} />
                <span>Create Free Account (+100 CR)</span>
              </Button>
            </Link>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Button variant="outline" size="lg">
                <LogIn size={18} />
                <span>Sign In</span>
              </Button>
            </Link>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--shadcn-border)',
          padding: '24px 20px',
          textAlign: 'center',
          color: 'var(--shadcn-muted-fg)',
          fontSize: '0.85rem',
          background: '#09090b'
        }}
      >
        SkillSwap • Decentralized Peer-to-Peer Knowledge Exchange &amp; Virtual Credit Escrow
      </footer>
    </div>
  );
}
