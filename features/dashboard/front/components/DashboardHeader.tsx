'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Sun, Plus, ListChecks } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useHousehold } from '@/features/household/front/context'
import { formatHeaderDates } from '@/features/layout/lib/formatHeaderDates'
import { ChildSelector } from './ChildSelector'

function greetingName(sessionName: string | null | undefined, familyName: string): string {
  if (sessionName?.trim()) {
    return sessionName.trim().split(/\s+/)[0]
  }
  if (familyName.trim()) return familyName.trim()
  return 'there'
}

function formatGregorianDate(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

export function DashboardHeader() {
  const { data: session } = useSession()
  const { familyName } = useHousehold()
  const [now] = useState(() => new Date())
  const [dates, setDates] = useState(() => formatHeaderDates(now))
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const quickAddRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDates(formatHeaderDates(now))
  }, [now])

  useEffect(() => {
    if (!quickAddOpen) return
    function onDocClick(e: MouseEvent) {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setQuickAddOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [quickAddOpen])

  const name = greetingName(session?.user?.name, familyName)

  return (
    <section className="bg-white border-b border-slate-100" data-testid="dashboard-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Sun className="h-6 w-6 text-amber-400 shrink-0" aria-hidden="true" />
              Assalamu alaikum, {name}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              You&apos;re on track! Here&apos;s your snapshot for today.
            </p>
          </div>

          <div className="text-left lg:text-center">
            <p className="text-lg font-semibold text-slate-900" data-testid="dashboard-gregorian-date">
              {formatGregorianDate(now)}
            </p>
            <p className="text-sm text-forest-900 mt-0.5" lang="ar" dir="rtl">
              {dates.hijriDayMonthAr}
            </p>
            <p className="text-xs text-slate-400">{dates.hijriYearAndGregorian.split(' · ')[0]} AH</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <div className="relative" ref={quickAddRef}>
              <button
                type="button"
                onClick={() => setQuickAddOpen(v => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                aria-expanded={quickAddOpen}
                aria-haspopup="menu"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Quick Add
              </button>
              {quickAddOpen && (
                <div
                  className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20"
                  role="menu"
                  data-testid="quick-add-menu"
                >
                  <Link href="/quran" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" role="menuitem">
                    Log Quran
                  </Link>
                  <Link href="/attendance" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" role="menuitem">
                    Mark attendance
                  </Link>
                  <Link href="/lessons" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" role="menuitem">
                    Add lesson
                  </Link>
                </div>
              )}
            </div>
            <Link
              href="/plan"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-forest-900 text-forest-900 hover:bg-forest-50"
            >
              <ListChecks className="h-4 w-4" aria-hidden="true" />
              Today&apos;s Plan
            </Link>
          </div>
        </div>

        <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
          <ChildSelector />
        </div>
      </div>
    </section>
  )
}
