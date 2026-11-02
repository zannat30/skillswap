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
        flexDirection: 'column'
      }}
    >
      {/* Fixed Top shadcn/ui Header (Frozen at Top on Scroll) */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 1000,
          height: '72px',
          borderBottom: '1px solid var(--shadcn-border)',
          background: 'rgba(9, 9, 11, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px'
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

        <nav className="flex items-center" style={{ gap: '6px' }}>
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

        <div className="flex items-center gap-3">
          {!isLoadingAuth && user ? (
            <Link
              href={user.role === 'ADMIN' ? '/admin/disputes' : '/marketplace'}
              style={{ textDecoration: 'none' }}
            >
              <Button variant="default">
                <span>Go to Dashboard ({user.displayName})</span>
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
      </header>

      {/* Main Scrollable Content */}
      <main
        style={{
          flex: 1,
          maxWidth: '1220px',
          width: '100%',
          margin: '0 auto',
          padding: '128px 32px 100px',
          display: 'flex',
          flexDirection: 'column',
          gap: '96px'
        }}
      >
        {/* 1. HERO SECTION */}
        <Card
          style={{
            padding: '64px 44px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background:
              'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.12), #0c0c0f 68%)'
          }}
        >
          <Badge variant="emerald" style={{ padding: '6px 14px', marginBottom: '24px' }}>
            <Sparkles size={13} />
            <span>Decentralized Peer-to-Peer Knowledge Barter Economy</span>
          </Badge>

          <h1
            className="hero-title"
            style={{
              fontSize: '3.2rem',
              maxWidth: '840px',
              lineHeight: 1.14,
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
              margin: '0 auto 36px',
              fontSize: '1.08rem',
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

          {/* Economy Metrics Strip (shadcn Cards) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '16px',
              width: '100%'
            }}
          >
            <Card style={{ background: '#09090b' }}>
              <CardHeader style={{ padding: '20px', textAlign: 'center' }}>
                <div className="text-emerald font-bold" style={{ fontSize: '1.75rem' }}>
                  +100 CR
                </div>
                <CardDescription>Instant Onboarding Wallet Bonus</CardDescription>
              </CardHeader>
            </Card>

            <Card style={{ background: '#09090b' }}>
              <CardHeader style={{ padding: '20px', textAlign: 'center' }}>
                <div className="text-cyan font-bold" style={{ fontSize: '1.75rem' }}>
                  50 CR
                </div>
                <CardDescription>Fixed 60-Min Session Escrow Lock</CardDescription>
              </CardHeader>
            </Card>

            <Card style={{ background: '#09090b' }}>
              <CardHeader style={{ padding: '20px', textAlign: 'center' }}>
                <div className="text-emerald font-bold" style={{ fontSize: '1.75rem' }}>
                  +45 CR (90%)
                </div>
                <CardDescription>Released to Mentor on Completion</CardDescription>
              </CardHeader>
            </Card>

            <Card style={{ background: '#09090b' }}>
              <CardHeader style={{ padding: '20px', textAlign: 'center' }}>
                <div className="text-amber font-bold" style={{ fontSize: '1.75rem' }}>
                  -5 CR (10%)
                </div>
                <CardDescription>Deflationary Platform Fee Burn</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </Card>

        {/* 2. HOW IT WORKS (4-STEP WORKFLOW) */}
        <section id="how-it-works">
          <div className="text-center" style={{ marginBottom: '44px' }}>
            <Badge variant="cyan" style={{ padding: '5px 14px' }}>
              Step-by-Step Protocol
            </Badge>
            <h2
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                marginTop: '16px',
                marginBottom: '12px',
                letterSpacing: '-0.02em'
              }}
            >
              How the <span className="text-gradient">Zero-Trust Barter Lifecycle</span> Works
            </h2>
            <p
              className="text-secondary"
              style={{ maxWidth: '620px', margin: '0 auto', lineHeight: 1.65, fontSize: '0.98rem' }}
            >
              No credit cards or cash required. Learn from peers and earn credits by teaching what
              you know.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))',
              gap: '20px'
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
          <div className="text-center" style={{ marginBottom: '44px' }}>
            <Badge variant="emerald" style={{ padding: '5px 14px' }}>
              System Architecture
            </Badge>
            <h2
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                marginTop: '16px',
                marginBottom: '12px',
                letterSpacing: '-0.02em'
              }}
            >
              Built for <span className="text-gradient">Security, Fairness &amp; Speed</span>
            </h2>
            <p
              className="text-secondary"
              style={{ maxWidth: '620px', margin: '0 auto', lineHeight: 1.65, fontSize: '0.98rem' }}
            >
              Every credit transfer, session room, and domain check is enforced by strict
              server-side guarantees.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))',
              gap: '20px'
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
          <div className="text-center" style={{ marginBottom: '44px' }}>
            <Badge variant="violet" style={{ padding: '5px 14px' }}>
              Verified Categories
            </Badge>
            <h2
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                marginTop: '16px',
                marginBottom: '12px',
                letterSpacing: '-0.02em'
              }}
            >
              Permitted <span className="text-gradient">Knowledge Domains</span>
            </h2>
            <p
              className="text-secondary"
              style={{ maxWidth: '620px', margin: '0 auto', lineHeight: 1.65, fontSize: '0.98rem' }}
            >
              Protected by automated domain boundary enforcement to ensure ethical peer learning.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))',
              gap: '20px'
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
            padding: '56px 40px',
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
          <h2 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: '12px' }}>
            Ready to Join the SkillSwap Barter Network?
          </h2>
          <p
            className="text-secondary"
            style={{
              maxWidth: '580px',
              margin: '0 auto 32px',
              fontSize: '0.98rem',
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
          padding: '28px 32px',
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
