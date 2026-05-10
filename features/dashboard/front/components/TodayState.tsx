import { MetricCard } from './shared/MetricCard'
import type { DashboardMetrics } from '../types'

interface TodayStateProps {
  metrics: DashboardMetrics | null
}

export function TodayState({ metrics }: TodayStateProps) {
  if (!metrics) return null

  return (
    <section className="bg-slate-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">
          Today's State
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard label="Attendance Ready" value={metrics.attendanceReady} statusColor="green" />
          <MetricCard label="Lessons Planned"  value={metrics.lessonsPlanned}  statusColor="green" />
          <MetricCard label="Need Attention"   value={metrics.needsAttention}   statusColor="amber" />
          <MetricCard label="Quran Logged"     value={metrics.quranLogged}      statusColor="green" />
          <MetricCard label="Portfolio Items"  value={metrics.portfolioItems}   statusColor="blue"  />
        </div>
      </div>
    </section>
  )
}
