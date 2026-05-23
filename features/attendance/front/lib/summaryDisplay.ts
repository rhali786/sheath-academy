import type { AttendanceSummary, AttendanceStatus } from '@/features/attendance/types'
import { ATTENDANCE_STATUSES } from '@/features/attendance/types'

export function statusesWithCounts(summary: AttendanceSummary): AttendanceStatus[] {
  return ATTENDANCE_STATUSES.filter(status => summary.byStatus[status] > 0)
}

export function formatAttendanceSummaryLine(summary: AttendanceSummary): string {
  const parts = statusesWithCounts(summary).map(
    status => `${summary.byStatus[status]} ${status.replace(/_/g, ' ')}`,
  )
  return parts.length > 0 ? parts.join(', ') : 'No attendance recorded'
}
