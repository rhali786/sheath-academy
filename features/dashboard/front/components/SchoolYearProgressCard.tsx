'use client'

import { useEffect, useState } from 'react'
import type { SchoolYear } from '@/features/school-year/types'

function countWeekdays(start: Date, end: Date): number {
  let count = 0
  const d = new Date(start)
  d.setHours(0, 0, 0, 0)
  const e = new Date(end)
  e.setHours(0, 0, 0, 0)
  while (d <= e) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

interface SchoolYearProgress {
  currentDay: number
  totalDays: number
  currentWeek: number
  totalWeeks: number
  remainingDays: number
  pacing: 'on-pace' | 'behind' | 'ahead' | 'unknown'
}

function computeProgress(year: SchoolYear, today: Date): SchoolYearProgress {
  const start = parseLocalDate(year.startDate)
  const end = parseLocalDate(year.endDate)

  const todayNorm = new Date(today)
  todayNorm.setHours(0, 0, 0, 0)

  const effectiveEnd = todayNorm <= end ? todayNorm : end

  const currentDay = todayNorm >= start ? countWeekdays(start, effectiveEnd) : 0
  const totalDays = countWeekdays(start, end)

  // Week: Mon-based week count from start
  const msPerDay = 86400000
  const diffDays = Math.max(0, Math.floor((todayNorm.getTime() - start.getTime()) / msPerDay))
  const currentWeek = Math.min(Math.floor(diffDays / 7) + 1, 36)
  const totalWeeks = Math.round(totalDays / 5) || 36

  const tomorrow = new Date(todayNorm)
  tomorrow.setDate(todayNorm.getDate() + 1)
  const remainingDays = todayNorm < end ? countWeekdays(tomorrow, end) : 0

  // Pacing: expected % vs actual % by calendar position
  const expectedPct = totalDays > 0 ? currentDay / totalDays : 0
  const calendarPct = totalDays > 0
    ? Math.max(0, Math.floor((todayNorm.getTime() - start.getTime()) / msPerDay)) /
      Math.max(1, Math.floor((end.getTime() - start.getTime()) / msPerDay))
    : 0
  let pacing: SchoolYearProgress['pacing'] = 'on-pace'
  if (Math.abs(expectedPct - calendarPct) < 0.05) pacing = 'on-pace'
  else if (expectedPct < calendarPct - 0.05) pacing = 'behind'
  else if (expectedPct > calendarPct + 0.05) pacing = 'ahead'

  return { currentDay, totalDays, currentWeek, totalWeeks, remainingDays, pacing }
}

const PACING_STYLES: Record<SchoolYearProgress['pacing'], { label: string; color: string }> = {
  'on-pace': { label: 'On Pace', color: 'text-green-600 bg-green-50' },
  'behind':  { label: 'Behind',  color: 'text-amber-700 bg-amber-50' },
  'ahead':   { label: 'Ahead',   color: 'text-sky-700 bg-sky-50' },
  'unknown': { label: '—',       color: 'text-slate-400 bg-slate-50' },
}

export function SchoolYearProgressCard() {
  const [year, setYear] = useState<SchoolYear | null>(null)

  useEffect(() => {
    fetch('/api/school-years/active')
      .then(r => r.json())
      .then(body => { if (body.status === 'success') setYear(body.data) })
      .catch(() => {})
  }, [])

  if (!year) return null

  const today = new Date()
  const { currentDay, totalDays, currentWeek, totalWeeks, remainingDays, pacing } = computeProgress(year, today)
  const pacingMeta = PACING_STYLES[pacing]

  return (
    <div className="bg-white rounded-xl shadow-sm p-5" data-testid="school-year-progress-card">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">School Year Progress</p>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pacingMeta.color}`}>
          {pacingMeta.label}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{currentDay}</p>
          <p className="text-xs text-slate-400 mt-0.5">of {totalDays} days</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{currentWeek}</p>
          <p className="text-xs text-slate-400 mt-0.5">of {totalWeeks} weeks</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{remainingDays}</p>
          <p className="text-xs text-slate-400 mt-0.5">days left</p>
        </div>
      </div>
      <div className="mt-3">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-forest-600 rounded-full transition-all"
            style={{ width: `${totalDays > 0 ? Math.min(100, Math.round((currentDay / totalDays) * 100)) : 0}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1 text-right">{year.name}</p>
      </div>
    </div>
  )
}
