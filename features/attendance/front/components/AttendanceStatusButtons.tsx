'use client'

import type { AttendanceStatus } from '@/features/attendance/types'
import { ATTENDANCE_STATUSES, STATUS_LABELS } from '@/features/attendance/types'

const STATUS_BUTTON_STYLES: Record<AttendanceStatus, string> = {
  present: 'bg-green-600 hover:bg-green-700 text-white',
  absent: 'bg-red-600 hover:bg-red-700 text-white',
  partial: 'bg-amber-500 hover:bg-amber-600 text-white',
  excused: 'bg-sky-600 hover:bg-sky-700 text-white',
  sick: 'bg-orange-500 hover:bg-orange-600 text-white',
  holiday: 'bg-violet-600 hover:bg-violet-700 text-white',
  field_trip: 'bg-teal-600 hover:bg-teal-700 text-white',
  coop: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  makeup: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  not_school: 'bg-slate-500 hover:bg-slate-600 text-white',
}

interface AttendanceStatusButtonsProps {
  onSelect: (status: AttendanceStatus) => void
  disabled?: boolean
}

export function AttendanceStatusButtons({ onSelect, disabled }: AttendanceStatusButtonsProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">Mark as</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {ATTENDANCE_STATUSES.map(status => (
          <button
            key={status}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(status)}
            className={`py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${STATUS_BUTTON_STYLES[status]}`}
            data-testid={`attendance-status-${status}`}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>
    </div>
  )
}
