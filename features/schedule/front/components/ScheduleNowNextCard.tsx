'use client'

import { useState } from 'react'
import type { DaySchedule, ScheduleBlock, ReflowAction } from '@/features/schedule/types'
import { reflow } from '@/features/schedule/server/service'

interface ScheduleNowNextCardProps {
  schedule: DaySchedule
  currentTime: string  // HH:MM
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function findCurrentAndNext(
  blocks: ScheduleBlock[],
  currentTime: string,
): { current: ScheduleBlock | null; next: ScheduleBlock | null } {
  const now = toMinutes(currentTime)
  let current: ScheduleBlock | null = null
  let next: ScheduleBlock | null = null

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    const start = toMinutes(b.startTime)
    const end = toMinutes(b.endTime)

    if (start <= now && now < end) {
      current = b
      next = blocks[i + 1] ?? null
      break
    }
    if (start > now && !next) {
      // Haven't started yet — first upcoming is "next"
      next = b
    }
  }

  return { current, next }
}

export function ScheduleNowNextCard({ schedule: initialSchedule, currentTime }: ScheduleNowNextCardProps) {
  const [schedule, setSchedule] = useState(initialSchedule)
  const [showReflow, setShowReflow] = useState(false)

  const { current, next } = findCurrentAndNext(schedule.blocks, currentTime)

  function applyReflow(action: ReflowAction) {
    setSchedule(reflow(action, schedule, currentTime))
    setShowReflow(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5" data-testid="schedule-now-next-card">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Now & Next</p>

      {current && (
        <div className="mb-3">
          <p className="text-xs text-slate-400 mb-0.5">Now</p>
          <p className="text-sm font-semibold text-slate-900">{current.lesson.title}</p>
          <p className="text-xs text-slate-400">{current.startTime} – {current.endTime}</p>
        </div>
      )}

      {next && (
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-0.5">Next</p>
          <p
            className="text-sm font-medium text-slate-700"
            data-testid="next-block-title"
          >
            {next.lesson.title}
          </p>
          <p className="text-xs text-slate-400">{next.startTime}</p>
        </div>
      )}

      {!current && !next && (
        <p className="text-sm text-slate-400 mb-4">No blocks scheduled for now.</p>
      )}

      <button
        type="button"
        onClick={() => setShowReflow(v => !v)}
        className="text-xs font-medium text-amber-700 hover:text-amber-800 transition-colors"
      >
        {showReflow ? 'Cancel' : 'Pause Day'}
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
          <button
            type="button"
            onClick={() => applyReflow('push-teacher-led-later')}
            className="block text-xs text-slate-700 hover:text-slate-900"
          >
            Push teacher-led work later
          </button>
          <button
            type="button"
            onClick={() => applyReflow('convert-light-day')}
            className="block text-xs text-slate-700 hover:text-slate-900"
          >
            Convert to light day
          </button>
          <button
            type="button"
            onClick={() => applyReflow('reschedule-unfinished')}
            className="block text-xs text-slate-700 hover:text-slate-900"
          >
            Reschedule unfinished lessons
          </button>
        </div>
      )}
    </div>
  )
}
