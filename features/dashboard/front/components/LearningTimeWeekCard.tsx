'use client'

import { useEffect, useState } from 'react'
import { learningTimeApi } from '@/features/learning-time/front/services/api'
import type { LearningTimeSession } from '@/features/learning-time/types'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

function fmtLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekRange(today: Date): { from: string; to: string } {
  const dow = today.getDay()
  const daysFromMonday = dow === 0 ? 6 : dow - 1
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysFromMonday)
  return { from: fmtLocal(monday), to: fmtLocal(today) }
}

/** Bucket a session's logged time into a weekday using its ended (or started) UTC day. */
function bucketMinutes(sessions: LearningTimeSession[]): number[] {
  const minutesByWeekday = [0, 0, 0, 0, 0] // Mon..Fri
  for (const s of sessions) {
    const at = s.endedAt ?? s.startedAt
    if (!at) continue
    const utcDay = new Date(at).getUTCDay() // 0=Sun..6=Sat
    const index = utcDay === 0 || utcDay === 6 ? -1 : utcDay - 1
    if (index < 0 || index > 4) continue
    minutesByWeekday[index] += s.elapsedSeconds / 60
  }
  return minutesByWeekday
}

function formatHoursMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = Math.round(totalMinutes % 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

function LearningTimeIcon() {
  return (
    <svg className="w-[19px] h-[19px] text-forest-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <rect x="7" y="11" width="3" height="7" />
      <rect x="12" y="7" width="3" height="11" />
      <rect x="17" y="13" width="3" height="5" />
    </svg>
  )
}

export function LearningTimeWeekCard() {
  const [minutesByWeekday, setMinutesByWeekday] = useState<number[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    const { from, to } = getWeekRange(new Date())

    learningTimeApi.list({ from, to })
      .then(res => {
        if (!active) return
        setMinutesByWeekday(bucketMinutes(res.data))
        setLoading(false)
      })
      .catch(() => {
        if (active) {
          setMinutesByWeekday([])
          setLoading(false)
        }
      })

    return () => { active = false }
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm" data-testid="learning-time-week-card-loading">
        <div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse mb-4" />
        <div className="h-24 bg-slate-50 rounded animate-pulse" />
      </div>
    )
  }

  const totalMinutes = (minutesByWeekday ?? []).reduce((sum, m) => sum + m, 0)

  if (!minutesByWeekday || totalMinutes === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm" data-testid="learning-time-week-card-empty">
        <div className="flex items-center gap-2 mb-3">
          <LearningTimeIcon />
          <h3 className="text-[14.5px] font-bold text-slate-900">Learning Time</h3>
        </div>
        <p className="text-sm text-slate-400">No learning time logged this week.</p>
      </div>
    )
  }

  const maxMinutes = Math.max(...minutesByWeekday, 1)

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm" data-testid="learning-time-week-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LearningTimeIcon />
          <h3 className="text-[14.5px] font-bold text-slate-900">Learning Time</h3>
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">This week</span>
      </div>
      <div className="flex items-end justify-between gap-2 h-24">
        {WEEKDAY_LABELS.map((label, i) => {
          const minutes = minutesByWeekday[i]
          const heightPct = Math.max(4, Math.round((minutes / maxMinutes) * 100))
          return (
            <div key={label} className="flex flex-col items-center gap-1.5 flex-1" data-testid={`learning-time-bar-${label}`}>
              <div className="w-full h-16 bg-slate-100 rounded-md overflow-hidden flex items-end">
                <div className="w-full bg-forest-600 rounded-md" style={{ height: `${heightPct}%` }} />
              </div>
              <span className="text-[10px] uppercase tracking-wide text-slate-400">{label}</span>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-sm">
        <span className="font-bold text-slate-900 tabular-nums">{formatHoursMinutes(totalMinutes)}</span>
        <span className="text-slate-400"> logged</span>
      </p>
    </div>
  )
}
