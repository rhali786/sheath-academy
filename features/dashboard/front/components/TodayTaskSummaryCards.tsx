import { CheckCircle2, Clock, CalendarClock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DashboardMetrics } from '../types'

interface TodayTaskSummaryCardsProps {
  metrics: DashboardMetrics | null
  totalLearners?: number
}

function SummaryCard({
  label,
  value,
  hint,
  tone,
  Icon,
}: {
  label: string
  value: number
  hint: string
  tone: 'green' | 'blue' | 'orange'
  Icon: LucideIcon
}) {
  const iconTone =
    tone === 'green'
      ? 'bg-green-600 text-white'
      : tone === 'blue'
        ? 'bg-blue-600 text-white'
        : 'bg-orange-500 text-white'

  const hintTone =
    tone === 'green' ? 'text-green-600' : tone === 'blue' ? 'text-blue-600' : 'text-orange-600'

  return (
    <div
      className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
      data-testid={`task-summary-${tone}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-bold tabular-nums text-slate-900">{value}</p>
          <p className="text-sm font-semibold text-slate-700 mt-1">{label}</p>
          <p className={`text-sm mt-0.5 ${hintTone}`}>{hint}</p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconTone}`}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
      </div>
    </div>
  )
}

export function TodayTaskSummaryCards({ metrics, totalLearners }: TodayTaskSummaryCardsProps) {
  if (!metrics) return null

  const learnerCount = totalLearners ?? 0

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="today-task-summary-cards">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Lessons done"
          value={metrics.tasksCompleted}
          hint={`Across ${learnerCount} learner${learnerCount === 1 ? '' : 's'}`}
          tone="green"
          Icon={CheckCircle2}
        />
        <SummaryCard
          label="In progress"
          value={metrics.tasksInProgress}
          hint="On today's schedule"
          tone="blue"
          Icon={Clock}
        />
        <SummaryCard
          label="Overdue"
          value={metrics.tasksOverdue}
          hint="Needs attention"
          tone="orange"
          Icon={CalendarClock}
        />
      </div>
    </section>
  )
}
