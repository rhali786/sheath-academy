'use client'
import {
  DROP_OFF_LABELS,
  LESSONS_HELP,
  LESSONS_LABEL,
  ACTIVITY_LABEL,
  ACTIVITY_HELP,
} from '@/features/admin-metrics/front/constants'
import type { AdminMetricsUserRow } from '@/features/admin-metrics/types'

function learnerLine(row: AdminMetricsUserRow): string {
  if (row.learnerNames && row.learnerNames.length > 0) {
    return row.learnerNames.join(', ')
  }
  if (row.learnerCount > 0) return `${row.learnerCount} learner${row.learnerCount === 1 ? '' : 's'}`
  return '—'
}

function lessonsLine(row: AdminMetricsUserRow): string {
  const tasks = row.lessonTasksInPeriod ?? 0
  const completed = row.lessonsCompletedInPeriod ?? 0
  return tasks === 0 ? '—' : `${tasks} tasks · ${completed} completed`
}

export interface AdminMetricsFamilyCardProps {
  row: AdminMetricsUserRow
  formatLastActive: (iso?: string) => string
}

function MetricRow({ label, value, help }: { label: string; value: string | number; help?: string }) {
  return (
    <div className="flex items-baseline justify-between py-1 border-b border-slate-50 last:border-0">
      <dt className="text-xs text-slate-500" title={help}>{label}</dt>
      <dd className="text-sm font-medium text-slate-800 tabular-nums">{value}</dd>
    </div>
  )
}

export function AdminMetricsFamilyCard({ row, formatLastActive }: AdminMetricsFamilyCardProps) {
  const displayUser = row.userEmail ?? row.userName ?? row.userId
  const isActive = row.isActiveInPeriod

  return (
    <article
      className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      data-testid={`admin-metrics-card-${row.workspaceId}`}
    >
      {/* Header band */}
      <div className={`px-4 py-3 border-b ${isActive ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-slate-900 leading-snug">{row.workspaceName}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{displayUser}</p>
          </div>
          <span className={`shrink-0 mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Last activity: {formatLastActive(row.lastActiveAt)}</p>
      </div>

      {/* Metric rows */}
      <dl className="px-4 py-3 space-y-0">
        <MetricRow label="Learners" value={learnerLine(row)} />
        <MetricRow label={LESSONS_LABEL} value={lessonsLine(row)} help={LESSONS_HELP} />
        <MetricRow label="Qur'an sessions" value={row.quranRecordsCreated} />
        <MetricRow label="Portfolio evidence" value={row.evidenceItemsCreated} />
        <MetricRow label={ACTIVITY_LABEL} value={row.sessionsLogged} help={ACTIVITY_HELP} />
      </dl>

      {/* Drop-off signals */}
      {row.dropOffSignals.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {row.dropOffSignals.map(signal => (
            <span
              key={signal}
              className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-[10px] text-amber-900 border border-amber-100"
            >
              {DROP_OFF_LABELS[signal]}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
