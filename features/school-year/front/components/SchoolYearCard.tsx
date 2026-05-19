'use client'

import type { SchoolYear, SchoolYearProgress } from '@/features/school-year/types'
import { calculatePlannedDaysLocal } from '@/features/school-year/front/lib/calculateDays'

interface SchoolYearCardProps {
  schoolYear: SchoolYear
  progress?: SchoolYearProgress | null
}

function computeProgress(year: SchoolYear): SchoolYearProgress {
  const schoolDays = year.schoolDays ?? ['mon', 'tue', 'wed', 'thu', 'fri']
  const breaks = year.breaks ?? []

  const totalDays = calculatePlannedDaysLocal({ startDate: year.startDate, endDate: year.endDate, schoolDays, breaks })

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  let dayNumber = 0
  if (todayStr >= year.startDate) {
    const effectiveEnd = todayStr <= year.endDate ? todayStr : year.endDate
    dayNumber = calculatePlannedDaysLocal({ startDate: year.startDate, endDate: effectiveEnd, schoolDays, breaks })
  }

  const daysPerWeek = schoolDays.length || 5
  const totalWeeks = Math.ceil(totalDays / daysPerWeek)
  const weekNumber = Math.min(Math.ceil(dayNumber / daysPerWeek), totalWeeks)

  return { dayNumber, totalDays, weekNumber, totalWeeks }
}

export function SchoolYearCard({ schoolYear, progress }: SchoolYearCardProps) {
  const prog = progress ?? computeProgress(schoolYear)
  const pct = prog.totalDays > 0 ? Math.round((prog.dayNumber / prog.totalDays) * 100) : 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5" data-testid="school-year-card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-slate-900">{schoolYear.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {schoolYear.startDate} → {schoolYear.endDate}
          </p>
        </div>
        {schoolYear.isActive && (
          <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-100 rounded-full px-2 py-0.5">
            Active
          </span>
        )}
      </div>

      <div className="text-sm text-slate-700 mb-2" data-testid="school-year-progress-text">
        Day {prog.dayNumber} of {prog.totalDays} planned school days · Week {prog.weekNumber} of {prog.totalWeeks}
      </div>

      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div
          className="bg-forest-900 h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%` }}
          aria-label={`${pct}% complete`}
        />
      </div>
      <p className="text-xs text-slate-400 mt-1">{pct}% complete</p>
    </div>
  )
}
