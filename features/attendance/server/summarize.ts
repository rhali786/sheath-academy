import type { AttendanceSummary } from '../types'
import { emptyAttendanceStatusCounts, isAttendanceStatus } from '../types'

export function summarizeAttendanceByStatus(
  childId: string,
  statuses: string[],
): AttendanceSummary {
  const byStatus = emptyAttendanceStatusCounts()
  let totalRecorded = 0

  for (const raw of statuses) {
    totalRecorded++
    if (isAttendanceStatus(raw)) {
      byStatus[raw]++
    }
  }

  return { childId, totalRecorded, byStatus }
}
