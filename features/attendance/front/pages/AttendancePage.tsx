'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { attendanceApi } from '@/features/attendance/front/services/api'
import { AttendanceList } from '@/features/attendance/front/components/AttendanceList'
import { AttendanceSummary } from '@/features/attendance/front/components/AttendanceSummary'
import { AttendanceStatusButtons } from '@/features/attendance/front/components/AttendanceStatusButtons'
import { BatchAttendanceForm } from '@/features/attendance/front/components/BatchAttendanceForm'
import type { AttendanceRecord, AttendanceStatus, AttendanceSummary as SummaryType } from '@/features/attendance/types'
import { emptyAttendanceSummary } from '@/features/attendance/types'
import { STATUS_LABELS } from '@/features/attendance/types'
import type { StudentProfile } from '@/features/lib/types'
import { childrenApi } from '@/features/children/front/services/api'
import { useHousehold } from '@/features/household/front/context'

type DateSort = 'desc' | 'asc'
type Mode = 'individual' | 'batch'

const ALL_STATUSES: AttendanceStatus[] = [
  'present', 'absent', 'partial', 'excused', 'sick', 'holiday', 'field_trip', 'coop', 'makeup', 'not_school',
]

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DEFAULT_SUMMARY: SummaryType = emptyAttendanceSummary('')

export function AttendancePage() {
  const { householdProfile } = useHousehold()
  const searchParams = useSearchParams()
  const [children, setChildren] = useState<StudentProfile[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [date, setDate] = useState<string>(todayLocal())
  const [notes, setNotes] = useState<string>('')
  const [hours, setHours] = useState<string>('')
  const [minutes, setMinutes] = useState<string>('')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<SummaryType>(DEFAULT_SUMMARY)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | ''>('')
  const [filterChildId, setFilterChildId] = useState<string>('')
  const [dateSort, setDateSort] = useState<DateSort>('desc')
  const [mode, setMode] = useState<Mode>('individual')
  const [batchLoading, setBatchLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    childrenApi.getAllChildren()
      .then(res => setChildren(res.data))
      .catch(() => setError('Failed to load learners'))
  }, [])

  // Sync URL childId → selectedChildId after children load and on URL changes
  useEffect(() => {
    if (children.length === 0) return
    const urlChildId = searchParams.get('childId')
    const matched = urlChildId ? children.find(c => c.id === urlChildId) : null
    setSelectedChildId(matched ? matched.id : children[0].id)
  }, [searchParams, children])

  async function fetchRecords() {
    try {
      setIsLoading(true)
      setError(null)
      const recs = await attendanceApi.getRecords({})
      setRecords(recs.data)
    } catch {
      setError('Failed to load attendance')
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchSummary(childId: string) {
    if (!childId) return
    try {
      const sum = await attendanceApi.getSummary(childId)
      setSummary(sum.data)
    } catch { /* ignore summary errors */ }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  useEffect(() => {
    fetchSummary(selectedChildId)
  }, [selectedChildId])

  async function markAttendance(status: AttendanceStatus) {
    if (!selectedChildId) return
    const householdId = householdProfile?.id ?? ''
    const data = {
      childId: selectedChildId,
      householdId,
      date,
      status,
      notes: notes.trim() || undefined,
      hours: hours !== '' ? Number(hours) : undefined,
      minutes: minutes !== '' ? Number(minutes) : undefined,
    }

    await attendanceApi.createRecord(data)
    setNotes('')
    setHours('')
    setMinutes('')
    await fetchRecords()
    await fetchSummary(selectedChildId)
  }

  async function handleArchive(id: string) {
    await attendanceApi.archiveRecord(id)
    await fetchRecords()
    await fetchSummary(selectedChildId)
  }

  async function handleUpdate(id: string, patch: Partial<AttendanceRecord>) {
    await attendanceApi.updateRecord(id, patch)
    await fetchRecords()
    await fetchSummary(selectedChildId)
  }

  async function handleBatchSubmit(entries: Array<{ childId: string; status: AttendanceStatus }>) {
    setBatchLoading(true)
    try {
      const householdId = householdProfile?.id ?? ''
      await attendanceApi.batchRecord({ date, householdId, entries })
      await fetchRecords()
      await fetchSummary(selectedChildId)
    } finally {
      setBatchLoading(false)
    }
  }

  const activeChildren = useMemo(() => children.filter(c => c.isActive), [children])

  const filteredRecords = useMemo(() => {
    let list = records
    if (filterStatus) list = list.filter(r => r.status === filterStatus)
    if (filterChildId) list = list.filter(r => r.childId === filterChildId)
    return [...list].sort((a, b) => {
      const cmp = a.date.localeCompare(b.date)
      return dateSort === 'asc' ? cmp : -cmp
    })
  }, [records, filterStatus, filterChildId, dateSort])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="page-title mb-0">Attendance</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Print
          </button>
          <button
            type="button"
            onClick={() => setShowForm(v => !v)}
            className="px-4 py-2 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800"
          >
            {showForm ? 'Cancel' : 'Mark attendance'}
          </button>
        </div>
      </div>

      {showForm && (
        <>
          <h2 className="form-section-heading">Mark attendance</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap gap-4 flex-1">
                <div className="flex-1 min-w-40">
                  <label htmlFor="attendance-date" className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    id="attendance-date"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>
                {mode === 'individual' && (
                  <div className="flex-1 min-w-40">
                    <label htmlFor="learner-select" className="block text-sm font-medium text-slate-700 mb-1">Learner</label>
                    <select
                      id="learner-select"
                      value={selectedChildId}
                      onChange={e => setSelectedChildId(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                    >
                      {children.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMode(m => m === 'individual' ? 'batch' : 'individual')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {mode === 'individual' ? 'Batch mode' : 'Individual mode'}
              </button>
            </div>

            {mode === 'batch' ? (
              <BatchAttendanceForm
                learners={activeChildren}
                date={date}
                onSubmit={handleBatchSubmit}
                loading={batchLoading}
              />
            ) : (
              <>
                <AttendanceStatusButtons onSelect={markAttendance} />
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                  <div className="flex gap-3">
                    <input
                      type="number"
                      placeholder="Hours"
                      value={hours}
                      onChange={e => setHours(e.target.value)}
                      min={0}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                    />
                    <input
                      type="number"
                      placeholder="Minutes"
                      value={minutes}
                      onChange={e => setMinutes(e.target.value)}
                      min={0}
                      max={59}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Summary</h2>
        <AttendanceSummary summary={summary} />
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-bold text-slate-900">Records</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterChildId}
              onChange={e => setFilterChildId(e.target.value)}
              aria-label="Filter by learner"
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              <option value="">All learners</option>
              {children.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as AttendanceStatus | '')}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              <option value="">All statuses</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <select
              value={dateSort}
              onChange={e => setDateSort(e.target.value as DateSort)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              <option value="desc">Date: newest first</option>
              <option value="asc">Date: oldest first</option>
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        {isLoading ? (
          <p className="text-sm text-slate-400 py-4">Loading…</p>
        ) : (
          <AttendanceList
            records={filteredRecords}
            childMap={Object.fromEntries(children.map(c => [c.id, c.name]))}
            onArchive={handleArchive}
            onUpdate={handleUpdate}
          />
        )}
      </div>
    </div>
  )
}
