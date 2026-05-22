'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ProductValidationWizard } from '@/features/product-validation/front/components/ProductValidationWizard'

export function FeedbackPage() {
  const { status, data: session } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div
        className="min-h-screen bg-slate-50 flex items-center justify-center px-4"
        data-testid="feedback-sign-in-required"
      >
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Sign in to share feedback</h1>
          <p className="text-sm text-slate-600 mb-6">
            Product validation responses are linked to your account. Anonymous submissions are not
            accepted.
          </p>
          <Link
            href="/login?callbackUrl=%2Ffeedback"
            className="inline-flex px-5 py-2.5 rounded-lg bg-forest-900 text-sm font-medium text-white hover:bg-forest-800"
          >
            Sign in
          </Link>
          <p className="mt-4">
            <Link href="/about" className="text-sm text-slate-500 hover:text-forest-900">
              ← Back to About
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <ProductValidationWizard defaultEmail={session?.user?.email ?? ''} />
      </div>
    </div>
  )
}
