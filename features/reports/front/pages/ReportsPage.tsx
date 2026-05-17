'use client'

import { useEffect, useMemo, useState } from 'react'
import { useContext_Dashboard } from '@/features/dashboard/front/context'
import type { RecordsReport } from '@/features/reports/types'
import { reportsApi } from '../services/api'

function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function ReportsPage() {
  const { children, selectedChildId, setSelectedChildId, loading: dashboardLoading } = useContext_Dashboard()
  const [childId, setChildId] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [report, setReport] = useState<RecordsReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const today = todayLocal()

  const dateError = useMemo(() => {
    if (startDate && startDate > today) return 'Start date cannot be in the future.'
    if (endDate && endDate > today) return 'End date cannot be in the future.'
    if (startDate && endDate && startDate > endDate) return 'Start date must be on or before end date.'
    return null
  }, [startDate, endDate, today])

  const activeChildId = useMemo(() => {
    return childId || selectedChildId || children[0]?.id || ''
  }, [childId, selectedChildId, children])

  useEffect(() => {
    if (!childId && activeChildId) setChildId(activeChildId)
  }, [activeChildId, childId])

  useEffect(() => {
    if (!activeChildId || dateError) return

    setLoading(true)
    setError(null)
    reportsApi
      .getRecordsReport({
        childId: activeChildId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      .then(res => setReport(res.data))
      .catch(err => setError(err.message ?? 'Failed to load reports'))
      .finally(() => setLoading(false))
  }, [activeChildId, startDate, endDate, dateError])

  function handleChildChange(nextChildId: string) {
    setChildId(nextChildId)
    setSelectedChildId(nextChildId)
  }

  if (dashboardLoading) {
    return <p className="p-6 text-sm text-slate-500">Loading reports...</p>
  }

  if (children.length === 0) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-900">Records summary</h1>
        <p className="mt-3 text-sm text-slate-500">Add a child before generating reports.</p>
      </main>
    )
  }

  return (
    <main className="reports-page bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="reports-toolbar flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Records summary</h1>
            <p className="mt-1 text-sm text-slate-500">Review and print a single-child homeschool records summary.</p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center rounded-md bg-forest-900 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Print records
          </button>
        </div>

        <div className="reports-controls mt-5 grid gap-3 md:grid-cols-3">
          <div>
            <label htmlFor="report-child" className="block text-xs font-semibold text-slate-500 mb-1">
              Child
            </label>
            <select
              id="report-child"
              value={activeChildId}
              onChange={e => handleChildChange(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="report-start" className="block text-xs font-semibold text-slate-500 mb-1">
              Start date
            </label>
            <input
              id="report-start"
              type="date"
              value={startDate}
              max={today}
              onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="report-end" className="block text-xs font-semibold text-slate-500 mb-1">
              End date
            </label>
            <input
              id="report-end"
              type="date"
              value={endDate}
              max={today}
              onChange={e => setEndDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>

        {dateError && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">{dateError}</p>
        )}

        {loading && <p className="mt-6 text-sm text-slate-500">Loading report...</p>}
        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

        {report && !loading && (
          <article className="print-report mt-8 space-y-8 bg-white px-6 py-6 shadow-sm">
            <header className="border-b border-slate-200 pb-5">
              <p className="text-xs font-semibold uppercase text-slate-500">Sheath Academy Records</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">{report.child.name}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {report.child.gradeLabel} | {report.dateRange.start} to {report.dateRange.end}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Generated: {new Date(report.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </header>

            <section>
              <h3 className="text-base font-bold text-slate-900">Records review</h3>
              {report.checklist.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">No advisory checklist items for this report.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {report.checklist.map(item => (
                    <li key={item.id} className="print-callout rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                      <p className="text-sm font-semibold text-amber-900">{item.label}</p>
                      <p className="text-sm text-amber-800">{item.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="print-stats grid gap-4 md:grid-cols-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Attendance</h3>
                <p className="mt-2 text-3xl font-bold text-slate-900">{report.attendance.totalRecorded}</p>
                <p className="text-sm text-slate-600">
                  {report.attendance.totalPresent} present, {report.attendance.totalPartial} partial, {report.attendance.totalAbsent} absent
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Subjects</h3>
                <p className="mt-2 text-3xl font-bold text-slate-900">{report.subjects.length}</p>
                <p className="text-sm text-slate-600">{report.subjects.map(subject => subject.name).join(', ')}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Portfolio evidence</h3>
                <p className="mt-2 text-3xl font-bold text-slate-900">{report.portfolio.count}</p>
                <p className="text-sm text-slate-600">Newest evidence appears first.</p>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-slate-900">Progress by subject</h3>
              <div className="mt-3 divide-y divide-slate-100">
                {report.progressBySubject.map(subject => (
                  <div key={`${subject.childId}-${subject.subjectId}`} className="py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-800">{subject.subjectName}</span>
                      <span className="text-sm text-slate-600">{percent(subject.completionRate)} complete</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {subject.completedCount} completed of {subject.plannedCount} planned
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-slate-900">Portfolio notes</h3>
              <div className="mt-3 space-y-3">
                {report.portfolio.items.map(item => (
                  <div key={item.id} className="border-t border-slate-100 pt-3">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.date} | {item.type}</p>
                    {item.notes && <p className="mt-1 text-sm text-slate-700">{item.notes}</p>}
                    {item.reflection && <p className="mt-1 text-sm text-slate-700">{item.reflection}</p>}
                  </div>
                ))}
              </div>
            </section>
          </article>
        )}
      </div>
    </main>
  )
}
