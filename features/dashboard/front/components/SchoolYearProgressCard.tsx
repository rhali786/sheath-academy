'use client'

import { useActiveSchoolYear } from '@/features/school-year/front/context/ActiveSchoolYearContext'
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

const PACING_STYLES: Record<SchoolYearProgress['pacing'], { label: string; color: string; ring: string }> = {
  'on-pace': { label: 'On Pace', color: 'text-green-600', ring: '#1e8a55' },
  'behind':  { label: 'Behind',  color: 'text-amber-700', ring: '#b45309' },
  'ahead':   { label: 'Ahead',   color: 'text-sky-700',   ring: '#0284c7' },
  'unknown': { label: '—',       color: 'text-slate-400', ring: '#94a3b8' },
}

export function SchoolYearProgressCard() {
  const { activeSchoolYear: year } = useActiveSchoolYear()

  if (!year) return null

  const today = new Date()
  const { currentDay, totalDays, currentWeek, totalWeeks, remainingDays, pacing } = computeProgress(year, today)
  const pacingMeta = PACING_STYLES[pacing]
  const pct = totalDays > 0 ? Math.min(100, Math.round((currentDay / totalDays) * 100)) : 0

  return (
    <div className="bg-white rounded-xl shadow-sm p-5" data-testid="school-year-progress-card">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-[19px] h-[19px] text-forest-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 3v18h18" />
          <path d="M7 15l4-5 4 3 5-7" />
        </svg>
        <h3 className="text-[14.5px] font-bold text-slate-900">School Year</h3>
      </div>

      <div
        className="relative w-28 h-28 mx-auto rounded-full"
        style={{ background: `conic-gradient(${pacingMeta.ring} calc(${pct}*1%), #f1f5f9 0)` }}
      >
        <div className="absolute inset-[14px] rounded-full bg-white flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold tabular-nums leading-none">Day {currentDay}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mt-1">of {totalDays}</span>
        </div>
      </div>

      <p className={`text-center text-sm font-semibold mt-3 ${pacingMeta.color}`}>{pacingMeta.label}</p>
      <p className="text-center text-xs text-slate-500 mt-0.5">
        Week {currentWeek} of {totalWeeks} · {remainingDays} days left
      </p>
      <p className="text-center text-xs text-slate-300 mt-1">{year.name}</p>
    </div>
  )
}
