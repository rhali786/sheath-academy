'use client'

import { useMemo, useState } from 'react'
import { attendanceApi } from '@/features/attendance/front/services/api'
import { AttendanceStatusButtons } from '@/features/attendance/front/components/AttendanceStatusButtons'
import type { AttendanceStatus } from '@/features/attendance/types'
import type { StudentProfile } from '@/features/lib/types'
import { useLearner } from '@/features/layout/front/context/LearnerContext'

function resolveFocusedLearner(
  children: StudentProfile[],
  selectedChildId: string | null,
): StudentProfile | null {
  const active = children.filter((c) => c.isActive)
  if (active.length === 0) return null
  if (selectedChildId) {
    const match = active.find((c) => c.id === selectedChildId)
    if (match) return match
  }
  return active[0]
}

interface ScheduleAttendanceCaptureProps {
  selectedDate: string
  householdId: string
  studentProfiles: StudentProfile[]
}

export function ScheduleAttendanceCapture({
  selectedDate,
  householdId,
  studentProfiles,
}: ScheduleAttendanceCaptureProps) {
  const { selectedChildId } = useLearner()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const focusedLearner = useMemo(
    () => resolveFocusedLearner(studentProfiles, selectedChildId),
    [studentProfiles, selectedChildId],
  )

  async function handleSelect(status: AttendanceStatus) {
    if (!focusedLearner) return
    setError(null)
    try {
      await attendanceApi.createRecord({
        childId: focusedLearner.id,
        householdId,
        date: selectedDate,
        status,
      })
    } catch {
      setError('Failed to save attendance')
    }
  }

  if (!focusedLearner) return null

  return (
    <div className="mt-6" data-testid="schedule-attendance-capture">
      <div className="flex items-center justify-between">
        <h2 className="form-section-heading mb-0">Mark attendance</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800"
        >
          {showForm ? 'Cancel' : 'Mark attendance'}
        </button>
      </div>
      {showForm && (
        <div className="add-form-card mt-4 space-y-4">
          <p className="text-sm text-slate-600">
            Recording for <span className="font-medium text-slate-900">{focusedLearner.name}</span> on{' '}
            <span className="font-medium text-slate-900">{selectedDate}</span>
          </p>
          <AttendanceStatusButtons onSelect={handleSelect} />
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
