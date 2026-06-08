'use client'

import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { InlineConfirm } from '@/features/lib/front/components/InlineConfirm'
import type { AttendanceRecord, AttendanceStatus } from '@/features/attendance/types'
import { STATUS_LABELS } from '@/features/attendance/types'

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-800 border-green-200',
  absent: 'bg-red-100 text-red-800 border-red-200',
  partial: 'bg-amber-100 text-amber-800 border-amber-200',
  excused: 'bg-blue-100 text-blue-800 border-blue-200',
  sick: 'bg-orange-100 text-orange-800 border-orange-200',
  holiday: 'bg-purple-100 text-purple-800 border-purple-200',
  field_trip: 'bg-teal-100 text-teal-800 border-teal-200',
  coop: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  makeup: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  not_school: 'bg-slate-100 text-slate-600 border-slate-200',
}

const ALL_STATUSES: AttendanceStatus[] = [
  'present', 'absent', 'partial', 'excused', 'sick', 'holiday', 'field_trip', 'coop', 'makeup', 'not_school',
]

interface Props {
  records: AttendanceRecord[]
  childMap: Record<string, string>
  onArchive: (id: string) => void
  onUpdate: (id: string, patch: Partial<AttendanceRecord>) => Promise<void>
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

interface RecordRowProps {
  record: AttendanceRecord
  childMap: Record<string, string>
  onArchive: (id: string) => void
  onUpdate: (id: string, patch: Partial<AttendanceRecord>) => Promise<void>
}

function RecordRow({ record, childMap, onArchive, onUpdate }: RecordRowProps) {
  const [confirmVoid, setConfirmVoid] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [editDate, setEditDate] = useState(record.date)
  const [editStatus, setEditStatus] = useState<AttendanceStatus>(record.status)
  const [editHours, setEditHours] = useState(record.hours !== undefined ? String(record.hours) : '')
  const [editMinutes, setEditMinutes] = useState(record.minutes !== undefined ? String(record.minutes) : '')
  const [editNotes, setEditNotes] = useState(record.notes ?? '')

  function startEdit() {
    setConfirmVoid(false)
    setEditDate(record.date)
    setEditStatus(record.status)
    setEditHours(record.hours !== undefined ? String(record.hours) : '')
    setEditMinutes(record.minutes !== undefined ? String(record.minutes) : '')
    setEditNotes(record.notes ?? '')
    setIsEditing(true)
  }

  function cancelEdit() {
    setIsEditing(false)
  }

  async function saveEdit() {
    setSaving(true)
    try {
      await onUpdate(record.id, {
        date: editDate,
        status: editStatus,
        hours: editHours !== '' ? Number(editHours) : undefined,
        minutes: editMinutes !== '' ? Number(editMinutes) : undefined,
        notes: editNotes.trim() || undefined,
      })
      setIsEditing(false)
    } catch {
      // keep form open on error
    } finally {
      setSaving(false)
    }
  }

  if (isEditing) {
    return (
      <li className="bg-white border border-forest-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-32">
              <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
              <input
                type="date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div className="flex-1 min-w-32">
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value as AttendanceStatus)}
                className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
              >
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Hours</label>
              <input
                type="number"
                min={0}
                value={editHours}
                onChange={e => setEditHours(e.target.value)}
                placeholder="Hours"
                className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Minutes</label>
              <input
                type="number"
                min={0}
                max={59}
                value={editMinutes}
                onChange={e => setEditMinutes(e.target.value)}
                placeholder="Minutes"
                className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
            <input
              type="text"
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelEdit}
              aria-label="Cancel edit"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg transition-colors"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={saving}
              aria-label="Save record"
              className="flex items-center gap-1 text-xs text-white bg-forest-900 hover:bg-forest-800 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Check className="w-3 h-3" /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </li>
    )
  }

  return (
    <li className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-1 rounded border ${STATUS_STYLES[record.status]}`}>
            {STATUS_LABELS[record.status]}
          </span>
          {childMap[record.childId] && (
            <span className="text-xs font-medium text-slate-600">{childMap[record.childId]}</span>
          )}
          <span className="text-sm font-medium text-slate-700">{formatDate(record.date)}</span>
          {record.notes && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-slate-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-label="Has notes"
              role="img"
            >
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" />
            </svg>
          )}
          {((record.hours ?? 0) > 0 || (record.minutes ?? 0) > 0) && (
            <span className="text-xs text-slate-500">
              {(record.hours ?? 0) > 0 && `${record.hours}h`}{' '}
              {(record.minutes ?? 0) > 0 && `${record.minutes}m`}
            </span>
          )}
        </div>
        <div className="flex gap-1 items-center shrink-0">
          {!confirmVoid && (
            <button
              onClick={startEdit}
              aria-label="Edit record"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {!confirmVoid && (
            <button
              onClick={() => setConfirmVoid(true)}
              aria-label="Void record"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {confirmVoid && (
        <div className="px-4 pb-4">
          <InlineConfirm
            message="Void this record?"
            confirmLabel="Void"
            onConfirm={() => onArchive(record.id)}
            onCancel={() => setConfirmVoid(false)}
          />
        </div>
      )}
    </li>
  )
}

export function AttendanceList({ records, childMap, onArchive, onUpdate }: Props) {
  if (records.length === 0) {
    return <p className="text-sm text-slate-400 py-6 text-center">No attendance records yet</p>
  }

  return (
    <ul className="space-y-2">
      {records.map(record => (
        <RecordRow
          key={record.id}
          record={record}
          childMap={childMap}
          onArchive={onArchive}
          onUpdate={onUpdate}
        />
      ))}
    </ul>
  )
}
