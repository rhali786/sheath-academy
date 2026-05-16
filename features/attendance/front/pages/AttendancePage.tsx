'use client'

import { useEffect, useState } from 'react'
import { attendanceApi } from '@/features/attendance/front/services/api'
import { AttendanceList } from '@/features/attendance/front/components/AttendanceList'
import { AttendanceSummary } from '@/features/attendance/front/components/AttendanceSummary'
import type { AttendanceRecord, AttendanceStatus, AttendanceSummary as SummaryType } from '@/features/attendance/types'
import type { StudentProfile } from '@/features/lib/types'
import { childrenApi } from '@/features/children/front/services/api'
import { useHousehold } from '@/features/household/front/context'

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DEFAULT_SUMMARY: SummaryType = { childId: '', totalPresent: 0, totalAbsent: 0, totalPartial: 0, totalRecorded: 0 }

export function AttendancePage() {
  const { householdProfile } = useHousehold()
  const [children, setChildren] = useState<StudentProfile[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [date, setDate] = useState<string>(todayLocal())
  const [notes, setNotes] = useState<string>('')
  const [hours, setHours] = useState<string>('')
  const [minutes, setMinutes] = useState<string>('')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<SummaryType>(DEFAULT_SUMMARY)
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    childrenApi.getAllChildren().then(res => {
      setChildren(res.data)
      if (res.data.length > 0) setSelectedChildId(res.data[0].id)
    }).catch(() => setError('Failed to load children'))
  }, [])

  async function fetchRecords(childId: string) {
    if (!childId) return
    try {
      setIsLoading(true)
      setError(null)
      const [recs, sum] = await Promise.all([
        attendanceApi.getRecords({ childId }),
        attendanceApi.getSummary(childId),
      ])
      setRecords(recs.data)
      setSummary(sum.data)
    } catch {
      setError('Failed to load attendance')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords(selectedChildId)
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

    if (editingRecord) {
      await attendanceApi.updateRecord(editingRecord.id, { status, notes: data.notes, hours: data.hours, minutes: data.minutes, date })
      setEditingRecord(null)
    } else {
      await attendanceApi.createRecord(data)
    }

    setNotes('')
    setHours('')
    setMinutes('')
    await fetchRecords(selectedChildId)
  }

  async function handleDelete(id: string) {
    await attendanceApi.deleteRecord(id)
    await fetchRecords(selectedChildId)
  }

  function handleEdit(record: AttendanceRecord) {
    setEditingRecord(record)
    setDate(record.date)
    setNotes(record.notes ?? '')
    setHours(record.hours !== undefined ? String(record.hours) : '')
    setMinutes(record.minutes !== undefined ? String(record.minutes) : '')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-40">
            <label className="block text-sm font-medium text-slate-700 mb-1">Child</label>
            <select
              value={selectedChildId}
              onChange={e => setSelectedChildId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              {children.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-40">
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="block text-sm font-medium text-slate-700 w-full">
            {editingRecord ? 'Update status' : 'Mark as'}
          </label>
          <button
            onClick={() => markAttendance('present')}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            Present
          </button>
          <button
            onClick={() => markAttendance('absent')}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Absent
          </button>
          <button
            onClick={() => markAttendance('partial')}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors"
          >
            Partial
          </button>
        </div>

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

        {editingRecord && (
          <button
            onClick={() => { setEditingRecord(null); setNotes(''); setHours(''); setMinutes(''); setDate(todayLocal()) }}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel edit
          </button>
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Summary</h2>
        <AttendanceSummary summary={summary} />
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Records</h2>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        {isLoading ? (
          <p className="text-sm text-slate-400 py-4">Loading…</p>
        ) : (
          <AttendanceList
            records={records}
            childMap={Object.fromEntries(children.map(c => [c.id, c.name]))}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )}
      </div>
    </div>
  )
}
