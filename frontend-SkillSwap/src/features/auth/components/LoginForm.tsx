'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, ArrowLeft, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { loginSchema } from '@/lib/validators';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';

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
    <Card style={{ width: '100%', maxWidth: '430px' }}>
      <CardHeader style={{ borderBottom: '1px solid var(--shadcn-border)', paddingBottom: '20px' }}>
        <div className="flex-between" style={{ marginBottom: '12px' }}>
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
        <CardTitle style={{ fontSize: '1.35rem' }}>Sign In to Your Account</CardTitle>
        <CardDescription>
          Enter your credentials to access your Escrow Wallet and Mentorship Workspace.
        </CardDescription>
      </CardHeader>

      <CardContent style={{ paddingTop: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <Label htmlFor="login-email">Email Address</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          )}

          <Button type="submit" variant="default" size="lg" disabled={submitting} className="w-full">
            <LogIn size={16} />
            <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
          </Button>
        </form>
      </CardContent>

      <CardFooter style={{ flexDirection: 'column', gap: '10px', textAlign: 'center' }}>
        <p className="text-secondary text-sm">
          New to SkillSwap?{' '}
          <Link href="/register" className="text-emerald font-bold" style={{ textDecoration: 'none' }}>
            Create Account (+100 CR Bonus)
          </Link>
        </p>
        <Link
          href="/"
          className="text-secondary text-xs flex items-center gap-2"
          style={{ textDecoration: 'none' }}
        >
          <ArrowLeft size={13} />
          <span>Back to Home</span>
        </Link>
      </CardFooter>
    </Card>
  );
}
