import Link from 'next/link'
import type { DaySchedule } from '@/features/schedule/types'
import { ScheduleNowNextCard } from '@/features/schedule/front/components/ScheduleNowNextCard'

interface TodaySchedulePanelProps {
  schedule: DaySchedule
  currentTime: string
}

export function TodaySchedulePanel({ schedule, currentTime }: TodaySchedulePanelProps) {
  const scheduledCount = schedule.blocks.length

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5" data-testid="today-schedule-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">Today&apos;s Schedule</h2>
        <Link href="/plan/schedule" className="text-sm font-medium text-forest-900 hover:underline">
          View Full Calendar
        </Link>
      </div>

      <ScheduleNowNextCard schedule={schedule} currentTime={currentTime} />

      <p className="text-xs text-slate-400 mt-4">
        {scheduledCount} of {scheduledCount} items scheduled
        {' · '}
        <Link href="/plan" className="text-forest-900 hover:underline">
          View Day&apos;s Plan
        </Link>
      </p>
    </section>
  )
}
