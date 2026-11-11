'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from 'cn';
import {
  MailCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Calendar,
  User,
  Hash,
  Check,
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
import { authApi } from '@/lib/api';

export function VerifyEmailForm({ className, ...props }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const { verifyEmail, updateProfile, user: currentUser } = useAuth();

  const [step, setStep] = useState('code'); // 'code' | 'details' | 'completed'
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');

  // Post-verification student profile fields
  const [sicNo, setSicNo] = useState('');
  const [batch, setBatch] = useState('2023 - 2027');
  const [gender, setGender] = useState('Male');

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [verifiedUser, setVerifiedUser] = useState(null);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // STEP 1: Verify 6-digit Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedCode = code.trim();
    if (!trimmedCode || trimmedCode.length < 4) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const userRes = await verifyEmail(email.trim(), trimmedCode);
      setVerifiedUser(userRes);

      // Pre-populate SIC No from email if email starts with roll / sic pattern
      const emailPrefix = (email.split('@')[0] || '').toUpperCase();
      if (/^[0-9]{2}[A-Z]{2,5}[0-9]{2,4}$/.test(emailPrefix)) {
        setSicNo(emailPrefix);
      }

      setStep('details');
      setSuccessMsg('Email verified successfully! Please enter your SIC No, Batch, and Gender.');
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Save SIC No, Batch, Gender
  const handleSaveStudentDetails = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanSic = sicNo.trim().toUpperCase();
    if (!cleanSic) {
      setError('Please enter your SIC No (Student Identification Code).');
      return;
    }

    if (cleanSic.length < 4) {
      setError('Please enter a valid SIC No (e.g. 22BTECH042 or 23MCA015).');
      return;
    }

    setLoading(true);

    try {
      await updateProfile({
        sicNo: cleanSic,
        batch: batch.trim(),
        gender: gender.trim(),
      });

      setStep('completed');
      setSuccessMsg('Profile completed successfully! Welcome to Silicon West.');

      setTimeout(() => {
        if (verifiedUser?.role === 'SUPER_ADMIN' || verifiedUser?.role === 'CLUB_ADMIN') {
          router.push('/dashboard');
        } else {
          router.push('/events');
        }
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update student profile details.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    if (!email.trim()) {
      setError('Please provide your email address to resend code.');
      return;
    }

    setResending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await authApi.resendVerification(email.trim());
      setSuccessMsg(res.message || 'A fresh verification code was sent to your email.');
      setCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-lg border-slate-200">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Left Column: Form */}
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <FieldGroup>
              {/* Stepper Indicator */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                      step === 'code'
                        ? 'bg-[#034694] text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {step === 'code' ? '1' : <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-xs font-bold ${step === 'code' ? 'text-[#034694]' : 'text-slate-500'}`}>
                    Verify Email
                  </span>
                </div>

                <div className="h-0.5 w-12 bg-slate-200" />

                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                      step === 'details'
                        ? 'bg-[#034694] text-white'
                        : step === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {step === 'completed' ? <Check className="w-3.5 h-3.5" /> : '2'}
                  </div>
                  <span className={`text-xs font-bold ${step === 'details' ? 'text-[#034694]' : 'text-slate-400'}`}>
                    SIC & Profile
                  </span>
                </div>
              </div>

              {/* Status Alerts */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* STEP 1: VERIFY CODE */}
              {step === 'code' && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="flex flex-col items-center gap-2 text-center mb-1">
                    <div className="w-12 h-12 rounded-2xl bg-[#034694] text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-400">
                      <ShieldCheck className="w-6 h-6 text-amber-300" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      Verify your email
                    </h1>
                    <p className="text-balance text-xs text-muted-foreground">
                      We sent a 6-digit verification code to{' '}
                      <span className="font-semibold text-slate-800">{email || 'your email'}</span>
                    </p>
                  </div>

                  {/* Target Account Badge */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-7 h-7 rounded-lg bg-[#034694]/10 text-[#034694] flex items-center justify-center shrink-0">
                        <MailCheck className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Target Account</span>
                        <span className="font-bold text-slate-800 truncate">{email || 'No email specified'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                      Pending
                    </span>
                  </div>

                  {/* 6-Digit Code */}
                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="code">Verification Code</FieldLabel>
                      <span className="text-[11px] text-slate-400">6 digits</span>
                    </div>
                    <Input
                      id="code"
                      type="text"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      className="text-center font-mono text-xl tracking-[0.5em] font-bold h-12"
                      autoFocus
                      required
                    />
                    <FieldDescription>
                      Check your official inbox or spam folder for the code from Silicon West.
                    </FieldDescription>
                  </Field>

                  {/* Verify Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#034694] hover:bg-[#02336d] text-white font-bold h-10 shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Verifying Code...
                      </>
                    ) : (
                      'Verify Email Code'
                    )}
                  </Button>

                  <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card text-xs">
                    Didn&apos;t get the code?
                  </FieldSeparator>

                  {/* Resend Action */}
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      type="button"
                      size="sm"
                      onClick={handleResend}
                      disabled={cooldown > 0 || resending}
                      className="text-xs flex items-center gap-1.5"
                    >
                      {resending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Sending...
                        </>
                      ) : cooldown > 0 ? (
                        `Resend code in ${cooldown}s`
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-[#034694]" />
                          Resend Verification Code
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* STEP 2: SIC NO, BATCH, GENDER */}
              {(step === 'details' || step === 'completed') && (
                <form onSubmit={handleSaveStudentDetails} className="space-y-4">
                  <div className="flex flex-col items-center gap-2 text-center mb-1">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-emerald-400">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      Complete Student Profile
                    </h1>
                    <p className="text-balance text-xs text-muted-foreground">
                      Enter your institutional details to access clubs and event registrations.
                    </p>
                  </div>

                  {/* Field 1: SIC No */}
                  <Field>
                    <FieldLabel htmlFor="sicNo">
                      SIC No (Student ID / Roll No) <span className="text-red-500">*</span>
                    </FieldLabel>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <Input
                        id="sicNo"
                        type="text"
                        placeholder="Enter your SIC number"
                        value={sicNo}
                        onChange={(e) => setSicNo(e.target.value.toUpperCase())}
                        className="pl-9 font-mono font-bold tracking-wider uppercase text-xs"
                        required
                        autoFocus
                      />
                    </div>
                    <FieldDescription>
                      Your unique Silicon Identification Code printed on your college ID card.
                    </FieldDescription>
                  </Field>

                  {/* Field 2: Batch */}
                  <Field>
                    <FieldLabel htmlFor="batch">
                      Graduating Batch <span className="text-red-500">*</span>
                    </FieldLabel>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <select
                        id="batch"
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#034694]/20 transition-all"
                        required
                      >
                        <option value="2021 - 2025">Batch 2021 - 2025</option>
                        <option value="2022 - 2026">Batch 2022 - 2026</option>
                        <option value="2023 - 2027">Batch 2023 - 2027</option>
                        <option value="2024 - 2028">Batch 2024 - 2028</option>
                        <option value="2025 - 2029">Batch 2025 - 2029</option>
                        <option value="2026 - 2030">Batch 2026 - 2030</option>
                      </select>
                    </div>
                    <FieldDescription>
                      Select your undergraduate or postgraduate academic tenure.
                    </FieldDescription>
                  </Field>

                  {/* Field 3: Gender */}
                  <Field>
                    <FieldLabel htmlFor="gender">
                      Gender <span className="text-red-500">*</span>
                    </FieldLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {['Male', 'Female', 'Other'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                            gender === g
                              ? 'bg-[#034694] text-white border-[#034694] shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading || step === 'completed'}
                    className="w-full bg-[#034694] hover:bg-[#02336d] text-white font-bold h-10 shadow-sm mt-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Saving Profile...
                      </>
                    ) : (
                      'Complete Registration & Proceed'
                    )}
                  </Button>
                </form>
              )}

              <FieldDescription className="text-center text-xs mt-4">
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-[#034694] hover:underline">
                  Sign in
                </Link>
              </FieldDescription>
            </FieldGroup>
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
                  <span>Student Identity & Access</span>
                </div>
              </div>

              <div className="space-y-3">
                <blockquote className="space-y-2">
                  <p className="text-lg font-bold leading-snug">
                    &ldquo;Authentic student membership ensures fair participation and verified team recognition across all events.&rdquo;
                  </p>
                  <footer className="text-xs text-slate-300 font-medium">
                    Silicon Institute of Technology, Sambalpur
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
