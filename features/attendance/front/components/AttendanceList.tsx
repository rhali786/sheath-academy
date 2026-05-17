'use client'

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

interface Props {
  records: AttendanceRecord[]
  childMap: Record<string, string>
  onArchive: (id: string) => void
  onEdit: (record: AttendanceRecord) => void
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function AttendanceList({ records, childMap, onArchive, onEdit }: Props) {
  if (records.length === 0) {
    return <p className="text-sm text-slate-400 py-6 text-center">No attendance records yet</p>
  }

  function handleVoid(id: string) {
    if (window.confirm('Archive this record? It will no longer appear in reports.')) {
      onArchive(id)
    }
  }

  return (
    <ul className="space-y-2">
      {records.map(record => (
        <li key={record.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
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
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(record)}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100"
            >
              Edit
            </button>
            <button
              onClick={() => handleVoid(record.id)}
              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
            >
              Void
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
