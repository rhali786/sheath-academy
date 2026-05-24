'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { adminMetricsApi } from '@/features/admin-metrics/front/services/api'

/**
 * Verifies admin access via API (server checks ADMIN_EMAIL).
 * Non-admins see a calm forbidden message instead of metrics UI.
 */
export function AdminPageGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    let cancelled = false
    adminMetricsApi
      .getSummary()
      .then(() => {
        if (!cancelled) setAllowed(true)
      })
      .catch(e => {
        if (!cancelled) setAllowed((e as { status?: number }).status === 403 ? false : null)
      })
    return () => {
      cancelled = true
    }
  }, [status])

  if (status === 'loading' || allowed === null) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <p className="text-sm text-slate-500">Checking access…</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <p className="text-sm text-slate-500" role="alert">
        Sign in to view admin metrics.
      </p>
    )
  }

  if (!allowed) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        data-testid="admin-page-forbidden"
      >
        You do not have access to this admin page. Set ADMIN_EMAIL in .env.local to your signed-in
        address (e.g. dev@sheathacademy.ai for dev bypass).
      </div>
    )
  }

  return <>{children}</>
}
