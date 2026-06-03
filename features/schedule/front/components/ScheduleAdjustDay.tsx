'use client'

import { useState } from 'react'
import type { DaySchedule, ReflowAction } from '@/features/schedule/types'
import { reflow } from '@/features/schedule/server/service'

interface ScheduleAdjustDayProps {
  schedule: DaySchedule
  currentTime: string
  onScheduleChange: (schedule: DaySchedule) => void
}

export function ScheduleAdjustDay({ schedule, currentTime, onScheduleChange }: ScheduleAdjustDayProps) {
  const [showReflow, setShowReflow] = useState(false)

  function applyReflow(action: ReflowAction) {
    onScheduleChange(reflow(action, schedule, currentTime))
    setShowReflow(false)
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-3" data-testid="schedule-adjust-day">
      <button
        type="button"
        onClick={() => setShowReflow(v => !v)}
        className="text-xs font-medium text-amber-700 hover:text-amber-800 transition-colors"
        aria-expanded={showReflow}
      >
        {showReflow ? 'Cancel adjust day' : 'Adjust day'}
      </button>

      {showReflow && (
        <div className="mt-3 space-y-2" data-testid="reflow-panel">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reflow options</p>
          <button
            type="button"
            onClick={() => applyReflow('compress')}
            className="block text-xs text-slate-700 hover:text-slate-900"
          >
            Compress day
          </button>
          <button
            type="button"
            onClick={() => applyReflow('pull-independent-forward')}
            className="block text-xs text-slate-700 hover:text-slate-900"
          >
            Pull independent work forward
          </button>
        </div>
      )}
    </div>
  )
}
