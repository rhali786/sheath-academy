'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import type { Alert } from '@/features/alerts/types'

interface NotificationBellDropdownProps {
  alerts: Alert[]
}

const SEVERITY_RANK: Record<Alert['severity'], number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export function NotificationBellDropdown({ alerts }: NotificationBellDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const openAlerts = alerts
    .filter(a => a.status === 'open')
    .sort((a, b) => {
      const severityDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
      if (severityDiff !== 0) return severityDiff
      const dateA = a.date ?? a.createdAt
      const dateB = b.date ?? b.createdAt
      return dateB.localeCompare(dateA)
    })

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid="dashboard-notification-bell"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {openAlerts.length > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[1rem] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
            data-testid="notification-badge"
          >
            {openAlerts.length}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-30"
          role="menu"
          data-testid="notification-dropdown"
        >
          <p className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Notifications
          </p>
          {openAlerts.length === 0 ? (
            <p className="px-3 py-3 text-sm text-slate-500" data-testid="notification-empty">
              No new notifications
            </p>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {openAlerts.map(alert => (
                <li key={alert.id}>
                  {alert.href ? (
                    <Link
                      href={alert.href}
                      className="block px-3 py-2 hover:bg-slate-50"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                    >
                      <p className="text-sm font-medium text-slate-900">{alert.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{alert.message}</p>
                    </Link>
                  ) : (
                    <div className="px-3 py-2" role="menuitem">
                      <p className="text-sm font-medium text-slate-900">{alert.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{alert.message}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
