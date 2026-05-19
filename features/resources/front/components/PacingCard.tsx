'use client'

import type { PaceResult } from '@/features/resources/types'

interface PacingCardProps {
  paceResult: PaceResult
  totalPages: number
  completedPages?: number
}

export function PacingCard({ paceResult, totalPages, completedPages = 0 }: PacingCardProps) {
  const { pagesPerDay, pagesPerDayNeeded, isOnTrack } = paceResult
  const remaining = totalPages - completedPages
  const percentDone = totalPages > 0 ? Math.round((completedPages / totalPages) * 100) : 0

  return (
    <div
      className={`rounded-xl border p-4 ${isOnTrack === false ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}
      data-testid="pacing-card"
    >
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Pacing</p>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{completedPages} of {totalPages} pages</span>
          <span>{percentDone}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-forest-700 rounded-full"
            style={{ width: `${percentDone}%` }}
          />
        </div>
      </div>

      {pagesPerDay !== undefined && (
        <p className="text-xs text-slate-600 mb-1">
          Original pace: <span className="font-medium">{pagesPerDay.toFixed(1)} pages/day</span>
        </p>
      )}

      {pagesPerDayNeeded !== undefined && isOnTrack === false && (
        <p className="text-xs text-amber-700 font-medium" data-testid="behind-pace-message">
          You need {pagesPerDayNeeded.toFixed(1)} pages/day to finish on time.
        </p>
      )}

      {pagesPerDayNeeded !== undefined && isOnTrack === true && (
        <p className="text-xs text-forest-700 font-medium" data-testid="on-pace-message">
          On track — {pagesPerDayNeeded.toFixed(1)} pages/day needed.
        </p>
      )}

      {remaining > 0 && pagesPerDayNeeded === undefined && (
        <p className="text-xs text-slate-500">
          {remaining} pages remaining.
        </p>
      )}
    </div>
  )
}
