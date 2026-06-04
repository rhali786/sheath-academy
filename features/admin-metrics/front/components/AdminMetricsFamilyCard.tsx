'use client'
import { useState } from 'react'
import {
  DROP_OFF_LABELS,
  LESSONS_HELP,
  LESSONS_LABEL,
  ATTENDANCE_LABEL,
  ATTENDANCE_HELP,
  ACTIVITY_LABEL,
  ACTIVITY_HELP,
} from '@/features/admin-metrics/front/constants'
import type { AdminMetricsUserRow } from '@/features/admin-metrics/types'
import { displayName } from '@/features/lib/displayName'

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
  formatLastLogin: (iso?: string) => string
}

function MetricRow({ label, value, help }: { label: string; value: string | number; help?: string }) {
  return (
    <div className="flex items-baseline justify-between py-1 border-b border-slate-50 last:border-0">
      <dt className="text-xs text-slate-500" title={help}>{label}</dt>
      <dd className="text-sm font-medium text-slate-800 tabular-nums">{value}</dd>
    </div>
  )
}

export function AdminMetricsFamilyCard({ row, formatLastActive, formatLastLogin }: AdminMetricsFamilyCardProps) {
  const [membersExpanded, setMembersExpanded] = useState(false)
  const displayUser = displayName({ name: row.userName, email: row.userEmail }) || row.userId
  const isActive = row.isActiveInPeriod
  const members = row.members ?? []

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
        <div className="flex items-center gap-3 mt-1">
          <p className="text-xs text-slate-400">Last activity: {formatLastActive(row.lastActiveAt)}</p>
          <p className="text-xs text-slate-400">Last login: {formatLastLogin(row.lastLoginAt)}</p>
        </div>
      </div>

      {/* Metric rows */}
      <dl className="px-4 py-3 space-y-0">
        <MetricRow label="Learners" value={learnerLine(row)} />
        <MetricRow label={LESSONS_LABEL} value={lessonsLine(row)} help={LESSONS_HELP} />
        <MetricRow label={ATTENDANCE_LABEL} value={row.attendanceEventsInPeriod} help={ATTENDANCE_HELP} />
        <MetricRow label="Qur'an sessions" value={row.quranRecordsCreated} />
        <MetricRow label="Portfolio evidence" value={row.evidenceItemsCreated} />
        <MetricRow label={ACTIVITY_LABEL} value={row.sessionsLogged} help={ACTIVITY_HELP} />
      </dl>

      {/* Members expand/collapse */}
      {members.length > 0 && (
        <div className="px-4 pb-3 border-t border-slate-50 pt-3">
          <button
            type="button"
            onClick={() => setMembersExpanded(v => !v)}
            aria-expanded={membersExpanded}
            aria-label={`Show members of ${row.workspaceName}`}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 min-h-[44px]"
          >
            <svg
              aria-hidden="true"
              className={`w-3.5 h-3.5 transition-transform ${membersExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            {members.length} member{members.length === 1 ? '' : 's'}
          </button>
          {membersExpanded && (
            <ul className="mt-2 space-y-1">
              {members.map(m => (
                <li key={m.userId} className="flex items-center justify-between text-xs text-slate-700">
                  <span>{m.name ? `${m.name} (${m.email})` : m.email}</span>
                  {m.role === 'owner' && (
                    <span className="ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-100">
                      Owner
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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
