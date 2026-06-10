'use client'

import { useEffect, useMemo, useState } from 'react'
import { useHousehold } from '@/features/household/front/context'
import { childrenApi } from '@/features/children/front/services/api'
import type { StudentProfile } from '@/features/lib/types'
import type { RecordsReport } from '@/features/records/types'
import { reportsApi } from '../services/api'
import { RecordsPrintReport } from '@/features/records/front/components/RecordsPrintReport'

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function ReportsPage() {
  const { householdProfile, loading: householdLoading } = useHousehold()
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([])
  const [childrenLoading, setChildrenLoading] = useState(true)
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [report, setReport] = useState<RecordsReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const today = todayLocal()

  useEffect(() => {
    if (householdLoading) return
    const householdId = householdProfile?.id
    if (!householdId) { setChildrenLoading(false); return }
    childrenApi.getChildren(householdId, false)
      .then(res => {
        const profiles = (res.data ?? []).filter((p: StudentProfile) => p.isActive)
        setStudentProfiles(profiles)
        if (profiles.length > 0) setSelectedChildId(profiles[0].id)
      })
      .catch(() => {})
      .finally(() => setChildrenLoading(false))
  }, [householdLoading, householdProfile?.id])

  const dateError = useMemo(() => {
    if (startDate && startDate > today) return 'Start date cannot be in the future.'
    if (endDate && endDate > today) return 'End date cannot be in the future.'
    if (startDate && endDate && startDate > endDate) return 'Start date must be on or before end date.'
    return null
  }, [startDate, endDate, today])

  useEffect(() => {
    if (!selectedChildId || dateError) return
    setLoading(true)
    setError(null)
    reportsApi
      .getRecordsReport({
        childId: selectedChildId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      .then(res => setReport(res.data))
      .catch(err => setError(err.message ?? 'Failed to load reports'))
      .finally(() => setLoading(false))
  }, [selectedChildId, startDate, endDate, dateError])

  if (householdLoading || childrenLoading) {
    return <p className="p-6 text-sm text-slate-500">Loading reports...</p>
  }

  if (studentProfiles.length === 0) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="page-title">Records summary</h1>
        <p className="mt-3 text-sm text-slate-500">Add a child before generating reports.</p>
      </main>
    )
  }

  return (
    <main className="reports-page bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="reports-toolbar flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="page-title mb-0">Records summary</h1>
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
              value={selectedChildId}
              onChange={e => setSelectedChildId(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {studentProfiles.map(child => (
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
          <RecordsPrintReport report={report} variant="full" className="mt-8" />
        )}
      </div>
    </main>
  )
}
