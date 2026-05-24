'use client'

import type { IslamicEventName } from '@/features/islamic-calendar/types'

interface IslamicCalendarCardProps {
  event: IslamicEventName
  daysUntil: number
  description?: string
  enabled?: boolean
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

export function IslamicCalendarCard({
  event,
  daysUntil,
  description,
  enabled = true,
}: IslamicCalendarCardProps) {
  if (!enabled) return null

  const text = getEventText(event, daysUntil)

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4"
      data-testid="islamic-calendar-card"
    >
      <p className="text-sm font-medium text-slate-800">{text}</p>
      {description && (
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      )}
      {daysUntil > 1 && (
        <p className="text-xs text-forest-700 mt-1 font-semibold">{daysUntil} days</p>
      )}
    </div>
  )
}
