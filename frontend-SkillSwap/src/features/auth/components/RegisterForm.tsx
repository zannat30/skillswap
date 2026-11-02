'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { registerSchema } from '@/lib/validators';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';

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
    <Card style={{ width: '100%', maxWidth: '440px' }}>
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
          <Badge variant="emerald">
            <Sparkles size={12} /> +100 CR Grant
          </Badge>
        </div>
        <CardTitle style={{ fontSize: '1.35rem' }}>Create Your Account</CardTitle>
        <CardDescription>
          Receive 100 Virtual Credits immediately upon registration to book 1-on-1 mentorship.
        </CardDescription>
      </CardHeader>

      <CardContent style={{ paddingTop: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <Label htmlFor="reg-name">Full Name / Display Name</Label>
            <Input
              id="reg-name"
              type="text"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="reg-email">Email Address</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="reg-password">Password</Label>
            <Input
              id="reg-password"
              type="password"
              placeholder="Minimum 6 characters"
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
            <UserPlus size={16} />
            <span>{submitting ? 'Creating Account...' : 'Register & Claim 100 Credits'}</span>
          </Button>
        </form>
      </CardContent>

      <CardFooter style={{ flexDirection: 'column', gap: '10px', textAlign: 'center' }}>
        <p className="text-secondary text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald font-bold" style={{ textDecoration: 'none' }}>
            Sign In
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
