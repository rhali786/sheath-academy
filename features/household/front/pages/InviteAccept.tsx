'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function InviteAcceptForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setErrorMessage('Invalid or missing invitation link.')
      setStatus('error')
      return
    }

    let cancelled = false

    async function accept() {
      const res = await fetch('/api/household/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (cancelled) return

      if (res.ok) {
        setStatus('success')
        router.replace('/dashboard')
      } else {
        const json = await res.json().catch(() => ({})) as { message?: string }
        setErrorMessage(json.message ?? 'Something went wrong. Please try again.')
        setStatus('error')
      }
    }

    accept()
    return () => { cancelled = true }
  }, [token, router])

  if (status === 'pending') {
    return (
      <p className="text-sm text-slate-500 py-4 text-center">Accepting your invitation…</p>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center py-4">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Invitation error</h2>
        <p className="text-sm text-slate-500 mb-4">{errorMessage}</p>
        <Link href="/login" className="text-sm font-medium text-forest-900 hover:underline">
          Go to login
        </Link>
      </div>
    )
  }

  return null
}

export default function InviteAccept() {
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
            <InviteAcceptForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
