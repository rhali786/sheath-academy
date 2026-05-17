import { MetricCard } from './shared/MetricCard'
import { childScopedHref } from '@/features/lib/front/navigation'
import type { DashboardMetrics } from '../types'

interface TodayStateProps {
  metrics: DashboardMetrics | null
  selectedChildId?: string | null
}

export function TodayState({ metrics, selectedChildId }: TodayStateProps) {
  if (!metrics) return null

  return (
    <section className="bg-slate-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">
          Today's State
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard label="Attendance Ready" value={metrics.attendanceReady} statusColor="green" href={childScopedHref('/attendance', selectedChildId)} />
          <MetricCard label="Lessons Planned"  value={metrics.lessonsPlanned}  statusColor="green" href={childScopedHref('/lessons', selectedChildId)} />
          <MetricCard label="Need Attention"   value={metrics.needsAttention}  statusColor="amber" href={childScopedHref('/lessons', selectedChildId)} />
          <MetricCard label="Quran Logged"     value={metrics.quranLogged}     statusColor="green" href={childScopedHref('/quran', selectedChildId)} />
          <MetricCard label="Portfolio Items"  value={metrics.portfolioItems}  statusColor="blue"  href={childScopedHref('/portfolio', selectedChildId)} />
        </div>
      </div>
    </section>
  )
}
