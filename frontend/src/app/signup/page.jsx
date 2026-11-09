import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-slate-100/60 p-6 md:p-10 relative">
      <div className="w-full max-w-sm md:max-w-4xl space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <SignupForm />
      </div>
    </div>
  )
}
