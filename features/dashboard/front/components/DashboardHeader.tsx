'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Sun, Plus, ListChecks } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useHousehold } from '@/features/household/front/context'
import { ChildSelector } from './ChildSelector'
import { DashboardDatePicker } from './DashboardDatePicker'
import { NotificationBellDropdown } from './NotificationBellDropdown'
import type { Alert } from '@/features/alerts/types'

function greetingName(sessionName: string | null | undefined, familyName: string): string {
  if (sessionName?.trim()) {
    return sessionName.trim().split(/\s+/)[0]
  }
  if (familyName.trim()) return familyName.trim()
  return 'there'
}

interface DashboardHeaderProps {
  selectedDate: string
  onDateChange: (dateStr: string) => void
  alerts: Alert[]
}

export function DashboardHeader({ selectedDate, onDateChange, alerts }: DashboardHeaderProps) {
  const { data: session } = useSession()
  const { familyName } = useHousehold()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const quickAddRef = useRef<HTMLDivElement>(null)

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

          <DashboardDatePicker selectedDate={selectedDate} onDateChange={onDateChange} />

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <NotificationBellDropdown alerts={alerts} />
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
                  <p className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                    Quick Add
                  </p>
                  <Link
                    href="/quran"
                    className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    role="menuitem"
                    onClick={() => setQuickAddOpen(false)}
                  >
                    Log Quran
                  </Link>
                  <Link
                    href="/attendance"
                    className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    role="menuitem"
                    onClick={() => setQuickAddOpen(false)}
                  >
                    Mark attendance
                  </Link>
                  <Link
                    href="/lessons"
                    className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    role="menuitem"
                    onClick={() => setQuickAddOpen(false)}
                  >
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
