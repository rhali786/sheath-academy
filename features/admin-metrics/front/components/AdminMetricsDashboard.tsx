'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminMetricsFamilyCard } from '@/features/admin-metrics/front/components/AdminMetricsFamilyCard'
import {
  DROP_OFF_LABELS,
  SESSION_EVENTS_HELP,
} from '@/features/admin-metrics/front/constants'
import { adminMetricsApi } from '@/features/admin-metrics/front/services/api'
import type { AdminMetricsSummary, AdminMetricsUserRow, DropOffSignal } from '@/features/admin-metrics/types'

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

export function formatLastActive(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function emptyCardsMessage(options: {
  search: string
  activeOnly: boolean
  dropOffFilter: DropOffSignal | ''
}): string {
  if (options.search.trim() || options.activeOnly || options.dropOffFilter) {
    return 'No families match your filter.'
  }
  return 'No usage data for this period.'
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
  const [search, setSearch] = useState('')

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
          search: search.trim() || undefined,
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
  }, [periodStart, periodEnd, activeOnly, dropOffFilter, search])

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- search refetches on Apply only
  }, [periodStart, periodEnd, activeOnly, dropOffFilter])

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
        <label className="text-sm text-slate-600 flex-1 min-w-[200px]">
          Search
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Family, email, learner…"
            className="mt-1 block w-full min-h-[44px] border border-slate-200 rounded-lg px-2 py-2 text-sm"
            data-testid="admin-metrics-search"
          />
        </label>
      </div>

      <details
        className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-700"
        data-testid="admin-metrics-glossary"
      >
        <summary className="cursor-pointer font-medium text-slate-800">
          How to read these metrics
        </summary>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>
            <span className="font-medium">Session events</span> — {SESSION_EVENTS_HELP}
          </li>
          <li>
            <span className="font-medium">Lessons (planner)</span> — tasks with due date in the period;
            completed uses planner status, not usage events alone.
          </li>
          <li>
            <span className="font-medium">Qur&apos;an / Evidence / Reports</span> — counts from usage
            events (quran_record_created, evidence_created, report_generated) in the period.
          </li>
        </ul>
        <p className="mt-3 font-medium text-slate-800">Drop-off signals</p>
        <ul className="mt-1 space-y-1 list-disc pl-5">
          {(Object.keys(DROP_OFF_LABELS) as DropOffSignal[]).map(key => (
            <li key={key}>
              <span className="font-medium">{DROP_OFF_LABELS[key]}</span>
            </li>
          ))}
        </ul>
      </details>

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
            <p
              className="text-xs font-medium text-slate-500 uppercase tracking-wide"
              title={SESSION_EVENTS_HELP}
            >
              Learning activity (session events)
            </p>
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

      <div data-testid="admin-metrics-cards">
        {rows.length === 0 ? (
          <p className="text-center text-slate-500 py-8" data-testid="admin-metrics-empty">
            {emptyCardsMessage({ search, activeOnly, dropOffFilter })}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.map(row => (
              <AdminMetricsFamilyCard key={row.workspaceId} row={row} formatLastActive={formatLastActive} />
            ))}
          </div>
        )}
        {total > rows.length && (
          <p className="text-xs text-slate-500 mt-3">Showing {rows.length} of {total} families</p>
        )}
      </div>
    </div>
  )
}
