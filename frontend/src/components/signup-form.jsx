'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from 'cn';
import {
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';

export function SignupForm({ className, ...props }) {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const isSiliconEmail = (str) => {
      if (!str || typeof str !== 'string') return false;
      const lower = str.toLowerCase().trim();
      return (
        lower.endsWith('@silicon.ac.in') ||
        lower.endsWith('@siliconwest.in') ||
        /@([a-z0-9.-]+\.)?silicon\.ac\.in$/.test(lower)
      );
    };

    if (!isSiliconEmail(email)) {
      setError('Registration can only be done with an official Silicon ID (e.g. yourname@silicon.ac.in or yourname@siliconwest.in).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register(name.trim(), email.trim(), password);
      router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-lg border-slate-200">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Left Column: Signup Form */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col justify-between">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-1">
                <div className="w-12 h-12 rounded-2xl bg-[#034694] text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-400">
                  S
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Create your account
                </h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Join the Silicon West Campus Community
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name Field */}
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>

              {/* Email Field */}
              <Field>
                <FieldLabel htmlFor="email">Official Silicon Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="yourname@silicon.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <FieldDescription>
                  Must be your official college email ID (@silicon.ac.in).
                </FieldDescription>
              </Field>

              {/* Password & Confirm Password */}
              <Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </Field>
                </div>
                <FieldDescription>
                  Must be at least 6 characters long.
                </FieldDescription>
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
                      Creating Account...
                    </>
                  ) : (
                    'Continue to Email Verification'
                  )}
                </Button>
                <div className="text-[11px] text-center text-slate-500 mt-1">
                  Step 1 of 2 • Email verification & SIC profile follows
                </div>
              </Field>

              <FieldDescription className="text-center text-xs">
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-[#034694] hover:underline">
                  Sign in
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          {/* Right Column: Hero Banner (signup-04 block) */}
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
                    &ldquo;Step into a thriving ecosystem of engineers, creators, and leaders at Silicon West.&rdquo;
                  </p>
                  <footer className="text-xs text-slate-300 font-medium">
                    Student Activities & Event Management Portal
                  </footer>
                </blockquote>

                <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
                  <span>Sambalpur, Odisha</span>
                  <Link href="/events" className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold">
                    Explore Events <ArrowRight className="w-3.5 h-3.5" />
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
