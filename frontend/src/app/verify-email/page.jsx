import React, { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { VerifyEmailForm } from '@/components/verify-email-form';

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-slate-100/60 p-6 md:p-10 relative">
      <div className="w-full max-w-sm md:max-w-4xl space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <Suspense
          fallback={
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#034694]" />
              <p className="text-xs text-slate-500">Loading verification form...</p>
            </div>
          }
        >
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}
