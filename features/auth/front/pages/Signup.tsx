'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'

interface FieldErrors {
  name?: string
  email?: string
  username?: string
  password?: string
  confirmPassword?: string
  _form?: string
}

export default function Signup() {
  const [fields, setFields] = useState({ name: '', email: '', username: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  function update(field: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFields(prev => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})
    setStatus('loading')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })

    const json = await res.json().catch(() => ({})) as { message?: string; errors?: FieldErrors }

    if (res.ok) {
      setStatus('success')
      return
    }

    setStatus('idle')
    if (json.errors) {
      setErrors(json.errors)
    } else {
      setErrors({ _form: json.message ?? 'Something went wrong. Please try again.' })
    }
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
          {status === 'success' ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-forest-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-forest-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-slate-900 mb-1">Account created</h2>
              <p className="text-sm text-slate-500 mb-4">You can now sign in with your email and password.</p>
              <Link href="/login" className="text-sm font-medium text-forest-900 hover:underline">
                Go to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold text-slate-900 mb-1">Create account</h2>
              <p className="text-sm text-slate-400 mb-6">For parents and teachers.</p>

              {errors._form && (
                <div role="alert" className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
                  {errors._form}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label htmlFor="signup-name" className="block text-xs font-medium text-slate-600 mb-1.5">
                    Name
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    value={fields.name}
                    onChange={update('name')}
                    autoComplete="name"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-900/20 focus:border-forest-900 transition-colors"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-xs font-medium text-slate-600 mb-1.5">
                    Email
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    value={fields.email}
                    onChange={update('email')}
                    autoComplete="email"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-900/20 focus:border-forest-900 transition-colors"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="signup-username" className="block text-xs font-medium text-slate-600 mb-1.5">
                    Username
                  </label>
                  <input
                    id="signup-username"
                    type="text"
                    value={fields.username}
                    onChange={update('username')}
                    autoComplete="username"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-900/20 focus:border-forest-900 transition-colors"
                  />
                  {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-xs font-medium text-slate-600 mb-1.5">
                    Password
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    value={fields.password}
                    onChange={update('password')}
                    autoComplete="new-password"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-900/20 focus:border-forest-900 transition-colors"
                  />
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="signup-confirm-password" className="block text-xs font-medium text-slate-600 mb-1.5">
                    Confirm password
                  </label>
                  <input
                    id="signup-confirm-password"
                    type="password"
                    value={fields.confirmPassword}
                    onChange={update('confirmPassword')}
                    autoComplete="new-password"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-900/20 focus:border-forest-900 transition-colors"
                  />
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-2.5 rounded-lg bg-forest-900 text-white text-sm font-medium hover:bg-forest-800 disabled:opacity-60 transition-colors"
                >
                  {status === 'loading' ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="text-forest-900 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
