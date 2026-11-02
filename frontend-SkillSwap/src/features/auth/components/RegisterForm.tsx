'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/apiClient';
import { registerSchema } from '@/lib/validators';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function RegisterForm() {
  const router = useRouter();
  const { loginUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse({ displayName, email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Invalid registration input');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(parsed.data)
      });
      if (res?.success) {
        loginUser(res.token, res.user);
        router.push('/marketplace');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
        <h3 className="text-lg font-bold mb-2">Create Account (+100 CR Grant)</h3>
        <p className="text-secondary text-sm mb-4">
          Receive 100 Virtual Credits immediately upon registration.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="text-xs text-secondary uppercase block mb-2">
              Full Name / Display Name
            </label>
            <Input
              type="text"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
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
              placeholder="Minimum 6 characters"
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
            {submitting ? 'Creating Account...' : 'Register & Claim 100 Credits'}
          </Button>
        </form>
        <p className="text-secondary text-sm text-center mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald">
            Sign In
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
