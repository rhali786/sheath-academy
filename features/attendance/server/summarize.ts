import type { AttendanceSummary } from '../types'
import { emptyAttendanceStatusCounts, normalizeAttendanceStatus } from '../types'

export function summarizeAttendanceByStatus(
  childId: string,
  statuses: string[],
): AttendanceSummary {
  const byStatus = emptyAttendanceStatusCounts()
  let totalRecorded = 0

  for (const raw of statuses) {
    totalRecorded++
    const status = normalizeAttendanceStatus(raw)
    if (status) {
      byStatus[status]++
    }
  }

  return { childId, totalRecorded, byStatus }
}
