'use client'

import { useEffect, useState } from 'react'
import { attendanceApi } from '@/features/attendance/front/services/api'
import type { AttendanceSummary } from '@/features/attendance/types'

function getCurrentWeekRange(): { start: string; end: string } {
  const today = new Date()
  const dow = today.getDay()
  const daysFromMonday = dow === 0 ? 6 : dow - 1
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysFromMonday)
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { start: fmt(monday), end: fmt(sunday) }
}

interface Props {
  childId: string | null
}

export function WeekAttendanceCard({ childId }: Props) {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!childId) return
    let active = true
    setLoading(true)
    setSummary(null)
    setError(false)
    const { start, end } = getCurrentWeekRange()
    attendanceApi.getSummary(childId, start, end)
      .then(res => { if (active) { setSummary(res.data); setLoading(false) } })
      .catch(() => { if (active) { setError(true); setLoading(false) } })
    return () => { active = false }
  }, [childId])

  if (!childId) return null

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-gray-400">
        Loading attendance...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-gray-400">
        Attendance data unavailable.
      </div>
    )
  }

  if (!summary || summary.totalRecorded === 0) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-gray-400">
        No attendance recorded this week.
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white divide-y">
      <div className="px-4 py-3 font-semibold text-slate-800 text-sm">This Week — Attendance</div>
      <div className="px-4 py-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-2xl font-bold text-green-700">{summary.totalPresent}</div>
          <div className="text-xs text-slate-500 mt-0.5">Present</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-yellow-600">{summary.totalPartial}</div>
          <div className="text-xs text-slate-500 mt-0.5">Partial</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600">{summary.totalAbsent}</div>
          <div className="text-xs text-slate-500 mt-0.5">Absent</div>
        </div>
      </div>
    </div>
  )
}
