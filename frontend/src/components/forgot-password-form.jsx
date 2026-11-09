'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from 'cn';
import {
  KeyRound,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Lock,
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
import { authApi } from '@/lib/api';

export function ForgotPasswordForm({ className, ...props }) {
  const router = useRouter();

  const [step, setStep] = useState(1); // 1 = Request code, 2 = Enter code & new password, 3 = Success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Step 1: Send reset code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.forgotPassword(email.trim());
      setSuccessMsg(res.message || 'Reset code sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.resetPassword(email.trim(), code.trim(), newPassword);
      setSuccessMsg(res.message || 'Password reset successfully!');
      setStep(3);
    } catch (err) {
      setError(err.message || 'Password reset failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend code from step 2
  const handleResend = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setSuccessMsg('A new reset code has been sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend reset code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-lg border-slate-200">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Left Column: Flow */}
          <div className="p-6 md:p-8 flex flex-col justify-between">
            {step === 1 && (
              <form onSubmit={handleRequestCode} className="space-y-6">
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center mb-1">
                    <div className="w-12 h-12 rounded-2xl bg-[#034694] text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-400">
                      <KeyRound className="w-6 h-6 text-amber-300" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      Forgot Password?
                    </h1>
                    <p className="text-balance text-xs text-muted-foreground">
                      Enter your registered institute email to receive a 6-digit password reset code.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Field>
                    <FieldLabel htmlFor="email">Email Address</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@siliconwest.ac.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <FieldDescription>
                      We will send a single-use 6-digit reset code to this email.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#034694] hover:bg-[#02336d] text-white font-bold h-10 shadow-sm"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Sending Code...
                        </>
                      ) : (
                        'Send Reset Code'
                      )}
                    </Button>
                  </Field>

                  <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card text-xs">
                    Remember your password?
                  </FieldSeparator>

                  <div className="text-center">
                    <Link
                      href="/login"
                      className="text-xs font-bold text-[#034694] hover:underline"
                    >
                      Return to Sign In
                    </Link>
                  </div>
                </FieldGroup>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center mb-1">
                    <div className="w-12 h-12 rounded-2xl bg-[#034694] text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-400">
                      <Lock className="w-6 h-6 text-amber-300" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      Set New Password
                    </h1>
                    <p className="text-balance text-xs text-muted-foreground">
                      Enter the 6-digit code sent to <span className="font-semibold text-slate-800">{email}</span>
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{error}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-700">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {/* 6-Digit Code */}
                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="code">Reset Code</FieldLabel>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={loading}
                        className="ml-auto text-xs text-[#034694] hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Resend
                      </button>
                    </div>
                    <Input
                      id="code"
                      type="text"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      className="text-center font-mono text-xl tracking-[0.4em] font-bold h-11"
                      required
                    />
                  </Field>

                  {/* New Password */}
                  <Field>
                    <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </Field>

                  {/* Confirm Password */}
                  <Field>
                    <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#034694] hover:bg-[#02336d] text-white font-bold h-10 shadow-sm"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Updating Password...
                        </>
                      ) : (
                        'Reset Password & Sign In'
                      )}
                    </Button>
                  </Field>

                  <div className="text-center text-xs pt-1">
                    <Link href="/login" className="font-bold text-[#034694] hover:underline">
                      Back to Sign In
                    </Link>
                  </div>
                </FieldGroup>
              </form>
            )}

            {step === 3 && (
              <div className="py-8 space-y-6 text-center">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900">Password Reset Complete!</h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Your password has been successfully updated. You can now access your account with your new credentials.
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full bg-[#034694] hover:bg-[#02336d] text-white font-bold h-10"
                >
                  Proceed to Sign In
                </Button>
              </div>
            )}
          </div>

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
                  <span>Account Security & Recovery</span>
                </div>
              </div>

              <div className="space-y-3">
                <blockquote className="space-y-2">
                  <p className="text-lg font-bold leading-snug">
                    &ldquo;Keep your student and club credentials secure with instant verification and recovery tools.&rdquo;
                  </p>
                  <footer className="text-xs text-slate-300 font-medium">
                    Silicon West Identity & Access Management
                  </footer>
                </blockquote>

                <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
                  <span>Need help?</span>
                  <Link href="/login" className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold">
                    Sign In <ArrowRight className="w-3.5 h-3.5" />
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
