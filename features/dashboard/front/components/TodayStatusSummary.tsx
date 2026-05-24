import type { DashboardMetrics } from '../types'

interface TodayStatusSummaryProps {
  metrics: DashboardMetrics | null
}

function parseAttendance(raw: string): { marked: number; total: number } {
  const parts = raw.split('/')
  if (parts.length === 2) {
    return { marked: parseInt(parts[0], 10) || 0, total: parseInt(parts[1], 10) || 0 }
  }
  return { marked: 0, total: 0 }
}

function readinessPercent(metrics: DashboardMetrics): number {
  const { marked, total } = parseAttendance(metrics.attendanceReady)
  if (total === 0) return 0
  const attendancePct = marked / total
  const quranOk = metrics.quranLogged !== 'None today' ? 1 : 0
  const lessonsOk = metrics.lessonsPlanned > 0 ? 1 : 0
  return Math.round(((attendancePct + quranOk + lessonsOk) / 3) * 100)
}

export function TodayStatusSummary({ metrics }: TodayStatusSummaryProps) {
  if (!metrics) return null

  const { marked, total } = parseAttendance(metrics.attendanceReady)
  const readiness = readinessPercent(metrics)
  const quranDone = metrics.quranLogged !== 'None today'

  return (
    <section className="bg-white border-b border-slate-100" data-testid="today-status-summary">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
              Today's Readiness
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-900 tabular-nums">{readiness}%</span>
              <span className="text-sm text-slate-500">daily readiness</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatusPill
              label="Attendance"
              value={total > 0 ? `${marked}/${total}` : '—'}
              ok={marked > 0 && marked === total}
              warn={marked > 0 && marked < total}
            />
            <StatusPill
              label="Quran"
              value={quranDone ? metrics.quranLogged : 'Not yet'}
              ok={quranDone}
              warn={false}
            />
            <StatusPill
              label="Needs Attention"
              value={String(metrics.needsAttention)}
              ok={metrics.needsAttention === 0}
              warn={metrics.needsAttention > 0}
            />
            <StatusPill
              label="Lessons Planned"
              value={String(metrics.lessonsPlanned)}
              ok={metrics.lessonsPlanned > 0}
              warn={false}
            />
            <StatusPill
              label="Portfolio Items"
              value={String(metrics.portfolioItems)}
              ok={metrics.portfolioItems > 0}
              warn={false}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function StatusPill({
  label, value, ok, warn,
}: { label: string; value: string; ok: boolean; warn: boolean }) {
  const color = ok
    ? 'bg-green-50 text-green-700 border-green-100'
    : warn
    ? 'bg-amber-50 text-amber-700 border-amber-100'
    : 'bg-slate-50 text-slate-500 border-slate-100'

  return (
    <div className={`px-3 py-2 rounded-lg border text-xs font-medium ${color}`}>
      <span className="text-slate-400 font-normal">{label}: </span>
      {value}
    </div>
  )
}
