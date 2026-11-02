'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/apiClient';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ displayName, email, password })
      });
      if (res?.success) {
        loginUser(res.token, res.user);
        router.push('/marketplace');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="modal-content glass-panel" style={{ maxWidth: '420px' }}>
      <div className="modal-header">
        <div className="brand" style={{ border: 'none', padding: 0, height: 'auto' }}>
          <div className="logo-box">S</div>
          <h2>
            Skill<span>Swap</span>
          </h2>
        </div>
      </div>
      <div className="modal-body">
        <h3 className="text-lg font-bold mb-2">Join SkillSwap (+100 CR Grant)</h3>
        <p className="text-secondary text-sm mb-4">
          Receive 100 Virtual Credits immediately upon registration.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="text-xs text-secondary uppercase block mb-2">
              Display Name
            </label>
            <Input
              type="text"
              placeholder="Zannatuz Zubaida Mim"
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
              placeholder="zannat@ist.edu.bd"
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
              placeholder="StrongPassword123!"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <Button type="submit" variant="primary" className="w-full justify-center">
            Register &amp; Claim 100 Credits
          </Button>
        </form>
        <p className="text-secondary text-sm text-center mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
