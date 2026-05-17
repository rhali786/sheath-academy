'use client'

import { useState } from 'react'
import type { StudentProfile } from '@/features/lib/types'
import type { AttendanceStatus } from '@/features/attendance/types'
import { STATUS_LABELS } from '@/features/attendance/types'

const BATCH_STATUSES: AttendanceStatus[] = ['present', 'absent', 'partial', 'excused', 'sick', 'holiday', 'field_trip', 'coop', 'makeup', 'not_school']

interface LearnerStatus {
  childId: string
  status: AttendanceStatus
}

interface Props {
  learners: StudentProfile[]
  date: string
  onSubmit: (entries: LearnerStatus[]) => Promise<void>
  loading: boolean
}

export function BatchAttendanceForm({ learners, date, onSubmit, loading }: Props) {
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(
    () => Object.fromEntries(learners.map(l => [l.id, 'present' as AttendanceStatus]))
  )

  function markAll(status: AttendanceStatus) {
    setStatuses(Object.fromEntries(learners.map(l => [l.id, status])))
  }

  async function handleSubmit() {
    const entries = learners.map(l => ({ childId: l.id, status: statuses[l.id] ?? 'present' }))
    await onSubmit(entries)
  }

  if (learners.length === 0) {
    return <p className="text-sm text-slate-400 py-4">No active learners found.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => markAll('present')}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
        >
          Mark all present
        </button>
        <button
          type="button"
          onClick={() => markAll('absent')}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
        >
          Mark all absent
        </button>
      </div>

      <div className="space-y-2">
        {learners.map(learner => (
          <div key={learner.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3">
            <span className="text-sm font-medium text-slate-800">{learner.name}</span>
            <select
              value={statuses[learner.id] ?? 'present'}
              onChange={e => setStatuses(s => ({ ...s, [learner.id]: e.target.value as AttendanceStatus }))}
              aria-label={`Status for ${learner.name}`}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              {BATCH_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2.5 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Saving…' : `Save attendance for ${date}`}
      </button>
    </div>
  )
}
