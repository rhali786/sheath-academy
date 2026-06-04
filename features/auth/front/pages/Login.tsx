'use client'

import { Suspense, useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn, getProviders } from 'next-auth/react'
import { SheathLogo } from '@/features/layout/front/components/SheathLogo'

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

type Tab = 'password' | 'magic'

function safeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

function magicLinkSendSucceeded(result: { ok?: boolean; error?: string | null } | undefined): boolean {
  return result?.ok === true && !result?.error
}

function magicLinkErrorMessage(error: string | undefined | null): string {
  if (error === 'Configuration') {
    return (
      'Email could not be sent. With Resend testing (onboarding@resend.dev), you can only send to the ' +
      'email on your Resend account. Otherwise verify your domain at resend.com/domains and set AUTH_EMAIL_FROM.'
    )
  }
  return 'Something went wrong. Please try again.'
}

function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null
  if (code === 'Configuration') {
    return (
      'OAuth is misconfigured. Set AUTH_URL=http://localhost:3000 in .env.local, restart the dev server, ' +
      'and add http://localhost:3000/api/auth/callback/google to Google Cloud → Credentials → Authorized redirect URIs.'
    )
  }
  if (code === 'OAuthSignin' || code === 'OAuthCallback') {
    return 'Google sign-in failed. Check AUTH_GOOGLE_ID/SECRET and that http://localhost:3000/api/auth/callback/google is allowlisted.'
  }
  if (code === 'OAuthAccountNotLinked') {
    return 'That account is already linked to another sign-in method. Use the same method you signed up with.'
  }
  return 'Sign-in failed. Please try again.'
}

function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-6">
      {(['password', 'magic'] as Tab[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTab(t)}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
            tab === t
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t === 'password' ? 'Password' : 'Magic link'}
        </button>
      ))}
    </div>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = safeCallbackUrl(searchParams.get('callbackUrl'))
  const authError = searchParams.get('error')

  const [tab, setTab] = useState<Tab>('password')

  // password tab
  const [credIdentifier, setCredIdentifier] = useState('')
  const [credPassword, setCredPassword] = useState('')
  const [credStatus, setCredStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [credError, setCredError] = useState<string | null>(null)

  // magic link tab
  const [email, setEmail] = useState('')
  const [magicStatus, setMagicStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [magicError, setMagicError] = useState<string | null>(null)

  // oauth
  const [oauth, setOauth] = useState({ google: false, facebook: false })
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  useEffect(() => {
    getProviders().then(providers => {
      if (!providers) return
      setOauth({ google: !!providers.google, facebook: !!providers.facebook })
    })
  }, [])

  async function handleCredSubmit(e: FormEvent) {
    e.preventDefault()
    if (!credIdentifier.trim()) {
      setCredError('Please enter your email or username.')
      setCredStatus('error')
      return
    }
    if (!credPassword) {
      setCredError('Please enter your password.')
      setCredStatus('error')
      return
    }
    setCredStatus('loading')
    setCredError(null)
    const result = await signIn('credentials', {
      identifier: credIdentifier.trim(),
      password: credPassword,
      redirect: false,
      callbackUrl,
    })
    if (result?.ok && !result?.error) {
      window.location.href = callbackUrl
    } else {
      setCredError('Incorrect email, username, or password.')
      setCredStatus('error')
    }
  }

  async function handleMagicSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setMagicError('Please enter your email address.')
      setMagicStatus('error')
      return
    }
    setMagicStatus('loading')
    setMagicError(null)
    const result = await signIn('resend', { email: email.trim(), redirect: false, callbackUrl })
    if (magicLinkSendSucceeded(result)) {
      setMagicStatus('success')
    } else {
      setMagicError(magicLinkErrorMessage(result?.error))
      setMagicStatus('error')
    }
  }

  async function handleOAuth(provider: 'google' | 'facebook') {
    setOauthLoading(provider)
    await signIn(provider, { callbackUrl, redirect: true })
  }

  const hasOAuth = oauth.google || oauth.facebook

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <SheathLogo size={40} data-testid="sheath-logo" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sheath</h1>
        </div>

        <div className="card p-8">

          {oauthErrorMessage(authError) && (
            <div role="alert" className="mb-5 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
              {oauthErrorMessage(authError)}
            </div>
          )}

          <TabBar tab={tab} setTab={(t) => { setTab(t); setCredStatus('idle'); setCredError(null); setMagicStatus('idle'); setMagicError(null) }} />

          {tab === 'password' && (
            <form onSubmit={handleCredSubmit} noValidate>
              {credStatus === 'error' && credError && (
                <div role="alert" className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
                  {credError}
                </div>
              )}

              <label htmlFor="cred-identifier" className="block text-xs font-medium text-slate-600 mb-1.5">
                Email or username
              </label>
              <input
                id="cred-identifier"
                type="text"
                value={credIdentifier}
                onChange={(e) => { setCredIdentifier(e.target.value); setCredStatus('idle') }}
                autoComplete="username"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-900/20 focus:border-forest-900 transition-colors mb-3"
              />

              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="cred-password" className="block text-xs font-medium text-slate-600">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-slate-400 hover:text-slate-600">
                  Forgot password?
                </Link>
              </div>
              <input
                id="cred-password"
                type="password"
                value={credPassword}
                onChange={(e) => { setCredPassword(e.target.value); setCredStatus('idle') }}
                autoComplete="current-password"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-900/20 focus:border-forest-900 transition-colors mb-4"
              />

              <button
                type="submit"
                disabled={credStatus === 'loading'}
                className="w-full py-2.5 rounded-lg bg-forest-900 text-white text-sm font-medium hover:bg-forest-800 disabled:opacity-60 transition-colors"
              >
                {credStatus === 'loading' ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}

          {tab === 'magic' && (
            magicStatus === 'success' ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-forest-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-forest-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-base font-semibold text-slate-900 mb-1">Check your email</h2>
                <p className="text-sm text-slate-500">
                  We sent a sign-in link to <span className="font-medium text-slate-700">{email}</span>. It expires in 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleMagicSubmit} noValidate>
                {magicStatus === 'error' && magicError && (
                  <div role="alert" className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
                    {magicError}
                  </div>
                )}

                <label htmlFor="email" className="block text-xs font-medium text-slate-600 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-900/20 focus:border-forest-900 transition-colors mb-4"
                />
                <button
                  type="submit"
                  disabled={magicStatus === 'loading'}
                  className="w-full py-2.5 rounded-lg bg-forest-900 text-white text-sm font-medium hover:bg-forest-800 disabled:opacity-60 transition-colors"
                >
                  {magicStatus === 'loading' ? 'Sending…' : 'Send magic link'}
                </button>
              </form>
            )
          )}

          {hasOAuth && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400">or continue with</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="flex flex-col gap-2.5">
                {oauth.google && (
                  <button
                    type="button"
                    disabled={oauthLoading !== null}
                    onClick={() => void handleOAuth('google')}
                    aria-label="Continue with Google"
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>
                )}
                {oauth.facebook && (
                  <button
                    type="button"
                    disabled={oauthLoading !== null}
                    onClick={() => void handleOAuth('facebook')}
                    aria-label="Continue with Facebook"
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Continue with Facebook
                  </button>
                )}
              </div>
            </>
          )}

          <p className="mt-5 text-center text-xs text-slate-400">
            New here?{' '}
            <Link href="/signup" className="text-forest-900 font-medium hover:underline">
              Create account
            </Link>
          </p>

          {DEV_MODE && <DevBypassSection callbackUrl={callbackUrl} />}
        </div>
      </div>
    </div>
  )
}

export function DevBypassSection({ callbackUrl = '/' }: { callbackUrl?: string }) {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function handleBypass(e: FormEvent) {
    e.preventDefault()
    if (!token.trim()) return
    setLoading(true)
    setError(false)
    const result = await signIn('bypass', {
      secret: token.trim(),
      redirect: false,
      callbackUrl: safeCallbackUrl(callbackUrl),
    })
    if (result?.ok) {
      window.location.href = safeCallbackUrl(callbackUrl)
    } else {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <div className="mt-5 pt-4 border-t border-dashed border-slate-200">
      <p className="text-xs text-slate-400 mb-2 text-center font-mono">dev access</p>
      {error && (
        <p role="alert" className="text-xs text-red-600 mb-2 text-center">Invalid bypass token</p>
      )}
      <form onSubmit={handleBypass} className="flex gap-2">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Bypass token"
          aria-label="Dev bypass token"
          className="flex-1 px-3 py-2 text-xs rounded-lg border border-dashed border-slate-300 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-xs font-medium rounded-lg border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {loading ? '…' : 'Go'}
        </button>
      </form>
    </div>
  )
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
