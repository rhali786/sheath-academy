'use client'

import type { DaySchedule } from '@/features/schedule/types'

interface SchedulePageProps {
  schedule: DaySchedule
}

export function SchedulePage({ schedule }: SchedulePageProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8" data-testid="schedule-page">
      <h1 className="page-title">
        Today&apos;s Schedule
        <span className="text-sm font-normal text-slate-400 ml-2">{schedule.date}</span>
      </h1>

      {schedule.blocks.length === 0 && (
        <p className="text-sm text-slate-400">No lessons scheduled for today.</p>
      )}

      <div className="space-y-3">
        {schedule.blocks.map((block) => (
          <div
            key={block.id}
            className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-4"
            data-testid={`schedule-block-${block.id}`}
          >
            <div className="text-xs font-mono text-slate-500 w-16 shrink-0">
              {block.startTime}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">{block.lesson.title}</p>
              {block.instructionMode && (
                <p className="text-xs text-slate-400 capitalize mt-0.5">
                  {block.instructionMode.replace(/-/g, ' ')}
                </p>
              )}
            </div>
            <div className="text-xs text-slate-400">{block.durationMinutes} min</div>
            {block.flexibilityState === 'locked' && (
              <span className="text-xs text-slate-400" title="Locked">🔒</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
