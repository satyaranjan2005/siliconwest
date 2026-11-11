'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from 'cn';
import {
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';

export function LoginForm({ className, ...props }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect');
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (user.role === 'SUPER_ADMIN' || user.role === 'CLUB_ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/my-registrations');
      }
    } catch (err) {
      if (err.data?.requiresVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-lg border-slate-200">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Left Column: Login Form */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col justify-between">
            <FieldGroup>
              {/* Brand Header */}
              <div className="flex flex-col items-center gap-2 text-center mb-1">
                <div className="w-12 h-12 rounded-2xl bg-[#034694] text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-400">
                  S
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Welcome back
                </h1>
                <p className="text-balance text-xs text-muted-foreground">
                  Sign in to your Silicon West Campus account
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Field */}
              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="yourname@silicon.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              {/* Password Field */}
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-xs text-[#034694] hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>

              {/* Submit Button */}
              <Field>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#034694] hover:bg-[#02336d] text-white font-bold h-10 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Authenticating...
                    </>
                  ) : (
                    'Sign In to Portal'
                  )}
                </Button>
              </Field>

              {/* Direct Link to Separate Sign Up Page */}
              <FieldDescription className="text-center text-xs pt-2">
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="font-bold text-[#034694] hover:underline"
                >
                  Create an account
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          {/* Right Column: Hero Banner */}
          <div className="relative hidden bg-slate-900 md:block overflow-hidden">
            <img
              src="/campus-hero.jpg"
              alt="Silicon West Campus"
              className="absolute inset-0 h-full w-full object-cover opacity-75"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-[#034694]/40" />

            {/* Content over image */}
            <div className="relative h-full flex flex-col justify-between p-8 text-white z-10">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Silicon Institute of Technology</span>
                </div>
              </div>

              <div className="space-y-3">
                <blockquote className="space-y-2">
                  <p className="text-lg font-bold leading-snug">
                    &ldquo;Empowering student communities, hackathons, and technical societies through unified digital access.&rdquo;
                  </p>
                  <footer className="text-xs text-slate-300 font-medium">
                    Silicon West Event & Club Management Platform
                  </footer>
                </blockquote>

                <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
                  <span>Sambalpur Campus Portal</span>
                  <Link href="/events" className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold">
                    Browse Events <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
