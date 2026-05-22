import {
  DROP_OFF_LABELS,
  LESSONS_HELP,
  LESSONS_LABEL,
  SESSION_EVENTS_HELP,
  SESSION_EVENTS_LABEL,
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
  return `${tasks} tasks · ${completed} completed`
}

export interface AdminMetricsFamilyCardProps {
  row: AdminMetricsUserRow
  formatLastActive: (iso?: string) => string
}

export function AdminMetricsFamilyCard({ row, formatLastActive }: AdminMetricsFamilyCardProps) {
  const displayUser = row.userEmail ?? row.userName ?? row.userId

  return (
    <article
      className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm space-y-3"
      data-testid={`admin-metrics-card-${row.workspaceId}`}
    >
      <div>
        <h3 className="font-semibold text-slate-900">{row.workspaceName}</h3>
        <p className="text-sm text-slate-600">{displayUser}</p>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active</dt>
          <dd className="text-slate-800">{row.isActiveInPeriod ? 'Yes' : 'No'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Last active</dt>
          <dd className="text-slate-800">{formatLastActive(row.lastActiveAt)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Learners</dt>
          <dd className="text-slate-800">{learnerLine(row)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide" title={LESSONS_HELP}>
            {LESSONS_LABEL}
          </dt>
          <dd className="text-slate-800">{lessonsLine(row)}</dd>
        </div>
        <div>
          <dt
            className="text-xs font-medium text-slate-500 uppercase tracking-wide"
            title={SESSION_EVENTS_HELP}
          >
            {SESSION_EVENTS_LABEL}
          </dt>
          <dd className="text-slate-800" title={SESSION_EVENTS_HELP}>
            {row.sessionsLogged}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Qur&apos;an</dt>
          <dd className="text-slate-800">{row.quranRecordsCreated}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Evidence</dt>
          <dd className="text-slate-800">{row.evidenceItemsCreated}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Reports</dt>
          <dd className="text-slate-800">{row.reportsGenerated}</dd>
        </div>
      </dl>

      {row.dropOffSignals.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
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
