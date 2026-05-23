'use client'

import type { AttendanceStatus, AttendanceSummary as SummaryType } from '@/features/attendance/types'
import { STATUS_LABELS } from '@/features/attendance/types'
import { statusesWithCounts } from '@/features/attendance/front/lib/summaryDisplay'

interface Props {
  summary: SummaryType
}

const STATUS_CARD_STYLES: Record<AttendanceStatus, { box: string; value: string; label: string }> = {
  present: { box: 'bg-green-50 border-green-200', value: 'text-green-700', label: 'text-green-600' },
  absent: { box: 'bg-red-50 border-red-200', value: 'text-red-700', label: 'text-red-600' },
  partial: { box: 'bg-amber-50 border-amber-200', value: 'text-amber-700', label: 'text-amber-600' },
  excused: { box: 'bg-sky-50 border-sky-200', value: 'text-sky-700', label: 'text-sky-600' },
  sick: { box: 'bg-orange-50 border-orange-200', value: 'text-orange-700', label: 'text-orange-600' },
  holiday: { box: 'bg-violet-50 border-violet-200', value: 'text-violet-700', label: 'text-violet-600' },
  field_trip: { box: 'bg-teal-50 border-teal-200', value: 'text-teal-700', label: 'text-teal-600' },
  coop: { box: 'bg-indigo-50 border-indigo-200', value: 'text-indigo-700', label: 'text-indigo-600' },
  makeup: { box: 'bg-emerald-50 border-emerald-200', value: 'text-emerald-700', label: 'text-emerald-600' },
  not_school: { box: 'bg-slate-50 border-slate-200', value: 'text-slate-700', label: 'text-slate-500' },
}

export function AttendanceSummary({ summary }: Props) {
  const activeStatuses = statusesWithCounts(summary)

  if (summary.totalRecorded === 0 || activeStatuses.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4">No attendance recorded yet for this learner.</p>
    )
  }

  return (
    <section className="space-y-3">
      <p className="text-xs text-slate-500">
        {summary.totalRecorded} record{summary.totalRecorded === 1 ? '' : 's'} total
      </p>
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {activeStatuses.map(status => {
          const styles = STATUS_CARD_STYLES[status]
          return (
            <article
              key={status}
              className={`border rounded-lg p-4 text-center ${styles.box}`}
              data-testid={`attendance-summary-${status}`}
            >
              <p className={`text-2xl font-bold ${styles.value}`}>{summary.byStatus[status]}</p>
              <p className={`text-sm mt-1 ${styles.label}`}>{STATUS_LABELS[status]}</p>
            </article>
          )
        })}
      </section>
    </section>
  )
}
