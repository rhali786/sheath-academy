'use client'

import { useState, useEffect, FormEvent, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'invalid' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
    }
  }, [token])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!password || !confirmPassword) return
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.')
      return
    }

    setStatus('loading')
    setErrorMessage(null)

    const res = await fetch('/api/auth/password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password, confirmPassword }),
    })

    if (res.ok) {
      setStatus('success')
    } else {
      const json = await res.json().catch(() => ({})) as { message?: string }
      if (res.status === 400) {
        setStatus('invalid')
      } else {
        setStatus('error')
        setErrorMessage(json.message ?? 'Something went wrong. Please try again.')
      }
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-forest-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-forest-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-slate-900 mb-2">Password updated</h2>
        <p className="text-sm text-slate-500 mb-4">You can now sign in with your new password.</p>
        <Link href="/login" className="text-sm font-medium text-forest-900 hover:underline">
          Sign in
        </Link>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="text-center py-4">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Link expired or invalid</h2>
        <p className="text-sm text-slate-500 mb-4">This reset link has already been used or has expired.</p>
        <Link href="/forgot-password" className="text-sm font-medium text-forest-900 hover:underline">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <>
      <h2 className="text-base font-semibold text-slate-900 mb-1">Set new password</h2>
      <p className="text-sm text-slate-400 mb-6">Choose a new password for your account.</p>

      {errorMessage && (
        <div role="alert" className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="reset-password" className="block text-xs font-medium text-slate-600 mb-1.5">
            New password
          </label>
          <input
            id="reset-password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrorMessage(null) }}
            autoComplete="new-password"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-900/20 focus:border-forest-900 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="reset-confirm-password" className="block text-xs font-medium text-slate-600 mb-1.5">
            Confirm password
          </label>
          <input
            id="reset-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setErrorMessage(null) }}
            autoComplete="new-password"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-900/20 focus:border-forest-900 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full py-2.5 rounded-lg bg-forest-900 text-white text-sm font-medium hover:bg-forest-800 disabled:opacity-60 transition-colors"
        >
          {status === 'loading' ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </>
  )
}

export default function ResetPassword() {
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
          <Suspense fallback={<p className="text-sm text-slate-500 py-4 text-center">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
