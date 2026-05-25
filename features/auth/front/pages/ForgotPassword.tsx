'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'submitted'>('idle')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!identifier.trim()) return
    setStatus('loading')
    await fetch('/api/auth/password/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim() }),
    })
    setStatus('submitted')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-forest-900 flex items-center justify-center shadow-sm">
            <span className="text-white text-lg font-bold leading-none" aria-hidden="true">ش</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sheath Academy</h1>
        </div>

        <div className="card p-8">
          {status === 'submitted' ? (
            <div className="text-center py-4">
              <h2 className="text-base font-semibold text-slate-900 mb-2">Check your inbox</h2>
              <p className="text-sm text-slate-500 mb-4">
                If this account can receive email, a reset link has been sent.
              </p>
              <Link href="/login" className="text-sm font-medium text-forest-900 hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold text-slate-900 mb-1">Reset password</h2>
              <p className="text-sm text-slate-400 mb-6">Enter your email or username and we&apos;ll send a reset link.</p>

              <form onSubmit={handleSubmit} noValidate>
                <label htmlFor="forgot-identifier" className="block text-xs font-medium text-slate-600 mb-1.5">
                  Email or username
                </label>
                <input
                  id="forgot-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-900/20 focus:border-forest-900 transition-colors mb-4"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-2.5 rounded-lg bg-forest-900 text-white text-sm font-medium hover:bg-forest-800 disabled:opacity-60 transition-colors"
                >
                  {status === 'loading' ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-slate-400">
                <Link href="/login" className="text-forest-900 font-medium hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
