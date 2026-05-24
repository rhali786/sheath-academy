import type { DashboardMetrics } from '../types'

interface TodayTaskSummaryCardsProps {
  metrics: DashboardMetrics | null
}

function SummaryCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: number
  hint: string
  tone: 'green' | 'blue' | 'orange'
}) {
  const toneClass =
    tone === 'green'
      ? 'text-green-600 bg-green-50 border-green-100'
      : tone === 'blue'
        ? 'text-blue-600 bg-blue-50 border-blue-100'
        : 'text-orange-600 bg-orange-50 border-orange-100'

  return (
    <div className={`rounded-xl border p-5 ${toneClass}`} data-testid={`task-summary-${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{label}</p>
      <p className="text-3xl font-bold tabular-nums mt-2">{value}</p>
      <p className="text-sm mt-1 opacity-90">{hint}</p>
    </div>
  )
}

export function TodayTaskSummaryCards({ metrics }: TodayTaskSummaryCardsProps) {
  if (!metrics) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="today-task-summary-cards">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Tasks Completed"
          value={metrics.tasksCompleted}
          hint="Today"
          tone="green"
        />
        <SummaryCard
          label="In Progress"
          value={metrics.tasksInProgress}
          hint="Keep going"
          tone="blue"
        />
        <SummaryCard
          label="Overdue"
          value={metrics.tasksOverdue}
          hint="Needs attention"
          tone="orange"
        />
      </div>
    </section>
  )
}
