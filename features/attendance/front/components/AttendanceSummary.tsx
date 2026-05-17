'use client'

import type { AttendanceSummary as SummaryType } from '@/features/attendance/types'

interface Props {
  summary: SummaryType
}

export function AttendanceSummary({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-green-700">{summary.totalPresent}</div>
        <div className="text-sm text-green-600 mt-1">Present</div>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-red-700">{summary.totalAbsent}</div>
        <div className="text-sm text-red-600 mt-1">Absent</div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-amber-700">{summary.totalPartial}</div>
        <div className="text-sm text-amber-600 mt-1">Partial</div>
      </div>
      {summary.missingDays !== undefined && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-slate-700">{summary.missingDays}</div>
          <div className="text-sm text-slate-500 mt-1">Missing</div>
        </div>
      )}
    </div>
  )
}
