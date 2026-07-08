'use client'

import type { IslamicEventName } from '@/features/islamic-calendar/types'

export interface IslamicCalendarEvent {
  id: string
  event: IslamicEventName
  daysUntil: number
  description?: string
}

interface IslamicCalendarCardProps {
  events: IslamicCalendarEvent[]
}

function getEventText(event: IslamicEventName, daysUntil: number): string {
  if (daysUntil === 0) {
    if (event === 'Sacred Month') return `You are in a Sacred Month`
    return `${event} begins today`
  }
  if (daysUntil === 1) {
    if (event === 'Sacred Month') return `A Sacred Month begins tomorrow`
    return `${event} begins tomorrow`
  }
  if (event === 'Sacred Month') return `A Sacred Month begins in ${daysUntil} days`
  return `${event} begins in ${daysUntil} days`
}

function getDueLabel(daysUntil: number): string {
  if (daysUntil === 0) return 'today'
  if (daysUntil === 1) return 'tomorrow'
  return `in ${daysUntil} days`
}

/** Single card holding every upcoming Islamic-calendar event, matching the prototype's one-card-many-rows layout. */
export function IslamicCalendarCard({ events }: IslamicCalendarCardProps) {
  if (events.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm" data-testid="islamic-calendar-card">
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <svg
          className="w-[19px] h-[19px] text-forest-700"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3a9 9 0 1 0 9 9c-4 2-9-1-9-5a5 5 0 0 1 0-4z" />
        </svg>
        <h3 className="text-[14.5px] font-bold text-slate-900">Islamic Calendar</h3>
      </div>
      <div className="px-5 pb-3">
        {events.map((e, i) => (
          <div
            key={e.id}
            className={`flex items-center justify-between gap-3 py-2.5 text-sm ${i > 0 ? 'border-t border-slate-100' : ''}`}
            title={getEventText(e.event, e.daysUntil)}
          >
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 truncate">{e.event}</p>
              {e.description && <p className="text-xs text-slate-400 truncate mt-0.5">{e.description}</p>}
            </div>
            <span className="text-xs font-bold text-forest-700 tabular-nums whitespace-nowrap">
              {getDueLabel(e.daysUntil)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
