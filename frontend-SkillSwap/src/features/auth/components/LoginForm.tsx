'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/apiClient';
import { loginSchema } from '@/lib/validators';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function LoginForm() {
  const router = useRouter();
  const { loginUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Invalid input');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(parsed.data)
      });
      if (res?.success) {
        loginUser(res.token, res.user);
        if (res.user?.role === 'ADMIN') {
          router.push('/admin/disputes');
        } else {
          router.push('/marketplace');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-content glass-panel" style={{ maxWidth: '420px' }}>
      <div className="modal-header">
        <Link
          href="/"
          className="brand"
          style={{ border: 'none', padding: 0, height: 'auto', textDecoration: 'none' }}
        >
          <div className="logo-box">S</div>
          <h2>
            Skill<span>Swap</span>
          </h2>
        </Link>
      </div>
      <div className="modal-body">
        <h3 className="text-lg font-bold mb-2">Sign In to Your Account</h3>
        <p className="text-secondary text-sm mb-4">
          Enter your credentials to access your Escrow Wallet and Mentorship Workspace.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="text-xs text-secondary uppercase block mb-2">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="text-xs text-secondary uppercase block mb-2">
              Password
            </label>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            className="w-full justify-center"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
        <p className="text-secondary text-sm text-center mt-4">
          New to SkillSwap?{' '}
          <Link href="/register" className="text-emerald">
            Create Account (+100 CR Bonus)
          </Link>
        </p>
        <p className="text-secondary text-xs text-center mt-2">
          <Link href="/" className="text-secondary">
            ← Back to Landing Page
          </Link>
        </p>
      </div>
    </div>
  );
}
