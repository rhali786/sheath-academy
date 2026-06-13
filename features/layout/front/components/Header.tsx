'use client'

import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useSyncAppHeaderHeight } from '@/features/layout/front/hooks/useSyncAppHeaderHeight'
import { HouseholdSwitcher } from '@/features/household/front/components/HouseholdSwitcher'
import { LearnerSwitcher } from '@/features/layout/front/components/LearnerSwitcher'
import { pickGreeting } from '@/features/layout/lib/greetings'
import { NotificationBellDropdown } from '@/features/dashboard/front/components/NotificationBellDropdown'
import type { Alert } from '@/features/alerts/types'

interface HeaderProps {
  onMenuOpen?: () => void
}

export function Header({ onMenuOpen }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null)
  const { data: session } = useSession()
  const greeting = useMemo(() => pickGreeting(), [])
  const displayName = session?.user?.name ?? null
  const [alerts, setAlerts] = useState<Alert[]>([])
  const pathname = usePathname()

  useSyncAppHeaderHeight(headerRef)

  const loadAlerts = useCallback(() => {
    fetch('/api/alerts')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(res => setAlerts(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadAlerts()
  }, [pathname, loadAlerts])

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm"
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            onClick={onMenuOpen}
            aria-label="Open navigation menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBellDropdown alerts={alerts} />

          {session ? (
            <div className="flex items-center gap-2">
              <HouseholdSwitcher />
              <LearnerSwitcher />
              <div className="hidden sm:flex flex-col items-end" data-testid="user-greeting-line">
                <span className="text-xs font-medium text-slate-700">
                  {greeting} {displayName ?? 'there'}
                </span>
                <span className="text-xs text-slate-400">({session.user?.email})</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label="Sign out"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-forest-900 text-white hover:bg-forest-800 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
