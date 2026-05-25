'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const next = new Date(y, m - 1, d + delta)
  return toDateStr(next)
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(y, m - 1, d))
}

interface DashboardDatePickerProps {
  selectedDate: string
  onDateChange: (dateStr: string) => void
}

export function DashboardDatePicker({ selectedDate, onDateChange }: DashboardDatePickerProps) {
  return (
    <div className="flex items-center gap-1" data-testid="dashboard-date-picker">
      <button
        type="button"
        onClick={() => onDateChange(addDays(selectedDate, -1))}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50"
        aria-label="Previous day"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="flex items-center gap-1.5 px-2 min-w-[10rem] justify-center">
        <Calendar className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
        <span className="text-sm font-medium text-slate-700" data-testid="dashboard-selected-date">
          {formatDisplayDate(selectedDate)}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onDateChange(addDays(selectedDate, 1))}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50"
        aria-label="Next day"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export { toDateStr as dashboardDateToStr, addDays as dashboardAddDays }
