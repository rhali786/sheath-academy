'use client'

import type { AttendanceRecord, AttendanceStatus } from '@/features/attendance/types'

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-800 border-green-200',
  absent: 'bg-red-100 text-red-800 border-red-200',
  partial: 'bg-amber-100 text-amber-800 border-amber-200',
}

interface Props {
  records: AttendanceRecord[]
  onDelete: (id: string) => void
  onEdit: (record: AttendanceRecord) => void
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function AttendanceList({ records, onDelete, onEdit }: Props) {
  if (records.length === 0) {
    return <p className="text-sm text-slate-400 py-6 text-center">No attendance records yet</p>
  }

  return (
    <ul className="space-y-2">
      {records.map(record => (
        <li key={record.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2 py-1 rounded border ${STATUS_STYLES[record.status]}`}>
              {record.status}
            </span>
            <span className="text-sm font-medium text-slate-700">{formatDate(record.date)}</span>
            {record.notes && <span className="text-xs text-slate-500 italic">{record.notes}</span>}
            {(record.hours !== undefined || record.minutes !== undefined) && (
              <span className="text-xs text-slate-500">
                {record.hours ?? 0}h {record.minutes ?? 0}m
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(record)}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(record.id)}
              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
