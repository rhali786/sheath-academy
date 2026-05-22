'use client'

import { useCallback, useEffect, useState } from 'react'
import { adminMetricsApi } from '@/features/admin-metrics/front/services/api'
import type { AdminMetricsSummary, AdminMetricsUserRow, DropOffSignal } from '@/features/admin-metrics/types'

const DROP_OFF_LABELS: Record<DropOffSignal, string> = {
  learners_no_activity: 'Learners created, no activity',
  started_not_completed: 'Started session, not completed',
  activity_no_evidence: 'Learning activity, no evidence',
  records_no_report: 'Records exist, no report generated',
  inactive_30_days: 'Inactive 30+ days',
}

function formatDelta(n: number): string {
  if (n > 0) return `+${n}`
  return String(n)
}

function defaultRange(): { start: string; end: string } {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 29)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

function FeatureUsageCell({ usage }: { usage: AdminMetricsUserRow['featureUsageByArea'] }) {
  const entries = Object.entries(usage).filter(([, n]) => (n ?? 0) > 0)
  if (entries.length === 0) return <span className="text-slate-400">—</span>
  return (
    <div className="flex flex-wrap gap-1 max-w-xs">
      {entries.map(([area, count]) => (
        <span
          key={area}
          className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 capitalize"
        >
          {area}: {count}
        </span>
      ))}
    </div>
  )
}

export function AdminMetricsDashboard() {
  const initial = defaultRange()
  const [periodStart, setPeriodStart] = useState(initial.start)
  const [periodEnd, setPeriodEnd] = useState(initial.end)
  const [summary, setSummary] = useState<AdminMetricsSummary | null>(null)
  const [rows, setRows] = useState<AdminMetricsUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeOnly, setActiveOnly] = useState(false)
  const [dropOffFilter, setDropOffFilter] = useState<DropOffSignal | ''>('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, u] = await Promise.all([
        adminMetricsApi.getSummary({ periodStart, periodEnd }),
        adminMetricsApi.getUsers({
          periodStart,
          periodEnd,
          activeOnly,
          dropOff: dropOffFilter || undefined,
        }),
      ])
      setSummary(s)
      setRows(u.rows)
      setTotal(u.total)
    } catch (e) {
      const status = (e as { status?: number }).status
      if (status === 403) {
        setError('You do not have access to usage metrics.')
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load usage metrics')
      }
    } finally {
      setLoading(false)
    }
  }, [periodStart, periodEnd, activeOnly, dropOffFilter])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !summary) {
    return <p className="text-sm text-slate-500" data-testid="admin-metrics-loading">Loading usage metrics…</p>
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        data-testid="admin-metrics-forbidden"
      >
        {error}
      </div>
    )
  }

  return (
    <div data-testid="admin-metrics-dashboard" className="space-y-8">
      <div className="flex flex-wrap gap-4 items-end">
        <label className="text-sm text-slate-600">
          From
          <input
            type="date"
            value={periodStart}
            onChange={e => setPeriodStart(e.target.value)}
            className="ml-2 border border-slate-200 rounded-lg px-2 py-1 text-sm"
            data-testid="admin-metrics-period-start"
          />
        </label>
        <label className="text-sm text-slate-600">
          To
          <input
            type="date"
            value={periodEnd}
            onChange={e => setPeriodEnd(e.target.value)}
            className="ml-2 border border-slate-200 rounded-lg px-2 py-1 text-sm"
            data-testid="admin-metrics-period-end"
          />
        </label>
        <button
          type="button"
          onClick={() => load()}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-forest-900 text-white hover:bg-forest-800"
        >
          Apply
        </button>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={e => setActiveOnly(e.target.checked)}
            data-testid="admin-metrics-active-only"
          />
          Active only
        </label>
        <select
          value={dropOffFilter}
          onChange={e => setDropOffFilter(e.target.value as DropOffSignal | '')}
          className="text-sm border border-slate-200 rounded-lg px-2 py-1"
          data-testid="admin-metrics-dropoff-filter"
        >
          <option value="">All drop-offs</option>
          {(Object.keys(DROP_OFF_LABELS) as DropOffSignal[]).map(key => (
            <option key={key} value={key}>
              {DROP_OFF_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="admin-metrics-hero">
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active users / families</p>
            <p className="text-2xl font-bold text-slate-900 mt-1" data-testid="hero-active-users">
              {summary.activeUsers} users · {summary.activeFamilies} families
            </p>
            <p className="text-xs text-slate-500 mt-1">
              vs prior period: {formatDelta(summary.previousPeriodComparison.activeUsersDelta)} users
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Learning activity</p>
            <p className="text-2xl font-bold text-slate-900 mt-1" data-testid="hero-sessions">
              {summary.sessionsLogged} sessions · {summary.completionEvents} completions
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Δ sessions {formatDelta(summary.previousPeriodComparison.sessionsDelta)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Proof & records</p>
            <p className="text-2xl font-bold text-slate-900 mt-1" data-testid="hero-evidence">
              {summary.evidenceItemsCreated} evidence · {summary.reportsGenerated} reports
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Deen records: {summary.deenRecordsCreated}
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full text-sm" data-testid="admin-metrics-table">
          <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Family</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Last active</th>
              <th className="px-3 py-2">Learners</th>
              <th className="px-3 py-2">Sessions</th>
              <th className="px-3 py-2">Completions</th>
              <th className="px-3 py-2">Not done</th>
              <th className="px-3 py-2">Qur&apos;an</th>
              <th className="px-3 py-2">Evidence</th>
              <th className="px-3 py-2">Reports</th>
              <th className="px-3 py-2">By area</th>
              <th className="px-3 py-2">Drop-off</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-3 py-8 text-center text-slate-500" data-testid="admin-metrics-empty">
                  No usage data for this period.
                </td>
              </tr>
            ) : (
              rows.map(row => (
                <tr key={row.workspaceId} data-testid={`admin-metrics-row-${row.workspaceId}`}>
                  <td className="px-3 py-2 text-slate-800">{row.userEmail ?? row.userName ?? row.userId}</td>
                  <td className="px-3 py-2">{row.workspaceName}</td>
                  <td className="px-3 py-2">{row.isActiveInPeriod ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2">{row.lastActiveAt?.slice(0, 10) ?? '—'}</td>
                  <td className="px-3 py-2">{row.learnerCount}</td>
                  <td className="px-3 py-2">{row.sessionsLogged}</td>
                  <td className="px-3 py-2">{row.completionEvents}</td>
                  <td className="px-3 py-2">{row.startedNotCompletedCount}</td>
                  <td className="px-3 py-2">{row.quranRecordsCreated}</td>
                  <td className="px-3 py-2">{row.evidenceItemsCreated}</td>
                  <td className="px-3 py-2">{row.reportsGenerated}</td>
                  <td className="px-3 py-2">
                    <FeatureUsageCell usage={row.featureUsageByArea} />
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600 max-w-[200px]">
                    {row.dropOffSignals.length === 0
                      ? '—'
                      : row.dropOffSignals.map(s => DROP_OFF_LABELS[s]).join('; ')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {total > rows.length && (
          <p className="text-xs text-slate-500 px-3 py-2">Showing {rows.length} of {total} families</p>
        )}
      </div>
    </div>
  )
}
