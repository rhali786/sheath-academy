import { MetricCard } from './shared/MetricCard'
import type { DashboardMetrics } from '../types'

interface TodayStateProps {
  metrics: DashboardMetrics | null
}

export function TodayState({ metrics }: TodayStateProps) {
  if (!metrics) return null

  return (
    <section className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's State</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Attendance Ready" value={metrics.attendanceReady} statusColor="green" />
          <MetricCard label="Lessons Planned" value={metrics.lessonsPlanned} statusColor="green" />
          <MetricCard label="Need Attention" value={metrics.needsAttention} statusColor="amber" />
          <MetricCard label="Quran Logged" value={metrics.quranLogged} statusColor="green" />
          <MetricCard label="Portfolio Items" value={metrics.portfolioItems} statusColor="green" />
        </div>
      </div>
    </section>
  )
}
