'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import type { Alert } from '@/features/alerts/types'
import type { ConversationSummary } from '@/features/messaging/types'
import { useUnreadMessages } from '@/features/messaging/front/hooks/useUnreadMessages'
import { listConversations } from '@/features/messaging/front/services/api'

interface NotificationBellDropdownProps {
  alerts: Alert[]
  onOpen?: () => void
}

const SEVERITY_RANK: Record<Alert['severity'], number> = {
  high: 0,
  medium: 1,
  low: 2,
}

function getConversationLabel(conv: ConversationSummary, currentUserId?: string): string {
  if (conv.type === 'group' && conv.title) return conv.title
  if (conv.type === 'direct') {
    const other = conv.participants.find((p) => p.userId !== currentUserId)
    return other?.userName || other?.userEmail || 'Unknown'
  }
  return conv.title || 'Unnamed'
}

export function NotificationBellDropdown({ alerts, onOpen }: NotificationBellDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()
  const currentUserId = session?.user?.userId
  const { count: unreadMessageCount } = useUnreadMessages()
  const [unreadConversations, setUnreadConversations] = useState<ConversationSummary[]>([])

  const openAlerts = alerts
    .filter(a => a.status === 'open')
    .sort((a, b) => {
      const severityDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
      if (severityDiff !== 0) return severityDiff
      const dateA = a.date ?? a.createdAt
      const dateB = b.date ?? b.createdAt
      return dateB.localeCompare(dateA)
    })

  const notificationCount = openAlerts.length + unreadMessageCount
  const hasNotifications = notificationCount > 0

  useEffect(() => {
    if (!currentUserId) {
      setUnreadConversations([])
      return
    }

    let active = true

    const loadUnreadConversations = async () => {
      try {
        const res = await listConversations()
        if (!active) return
        const unread = res.data.conversations
          .filter((c) => c.unreadCount > 0)
          .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''))
        setUnreadConversations(unread)
      } catch {
        if (active) setUnreadConversations([])
      }
    }

    void loadUnreadConversations()
    const id = setInterval(() => void loadUnreadConversations(), 15000)

    return () => {
      active = false
      clearInterval(id)
    }
  }, [currentUserId])

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
        onClick={() => {
          setOpen(v => {
            const next = !v
            if (next) onOpen?.()
            return next
          })
        }}
        className="relative border border-slate-200 bg-white rounded-lg p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid="dashboard-notification-bell"
      >
        <span className="text-base leading-none" aria-hidden="true">🔔</span>
        {hasNotifications && (
          <span
            className="absolute top-1 right-1 min-w-[1rem] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
            data-testid="notification-badge"
          >
            {notificationCount > 99 ? '99+' : notificationCount}
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
          {!hasNotifications ? (
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
              {unreadConversations.length > 0 && (
                <>
                  {openAlerts.length > 0 && (
                    <li className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Messages
                    </li>
                  )}
                  {unreadConversations.map((conv) => {
                    const label = getConversationLabel(conv, currentUserId)
                    const title =
                      conv.unreadCount === 1
                        ? `New message from ${label}`
                        : `${conv.unreadCount} new messages from ${label}`
                    const preview = conv.lastMessage?.body ?? 'Open conversation'
                    return (
                      <li key={`msg-${conv.id}`}>
                        <Link
                          href={`/messages?c=${conv.id}`}
                          className="block px-3 py-2 hover:bg-slate-50"
                          role="menuitem"
                          onClick={() => setOpen(false)}
                        >
                          <p className="text-sm font-medium text-slate-900">{title}</p>
                          <p className="text-xs text-slate-500 line-clamp-2">{preview}</p>
                        </Link>
                      </li>
                    )
                  })}
                </>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
