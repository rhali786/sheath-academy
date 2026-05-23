import { summarizeAttendanceByStatus } from '@/features/attendance/server/summarize'
import { emptyAttendanceStatusCounts } from '@/features/attendance/types'

describe('summarizeAttendanceByStatus', () => {
  it('returns zero counts for no records', () => {
    const summary = summarizeAttendanceByStatus('child_1', [])
    expect(summary.childId).toBe('child_1')
    expect(summary.totalRecorded).toBe(0)
    expect(summary.byStatus).toEqual(emptyAttendanceStatusCounts())
  })

  it('counts each valid status separately', () => {
    const summary = summarizeAttendanceByStatus('child_1', [
      'present',
      'present',
      'absent',
      'excused',
      'partial',
    ])
    expect(summary.totalRecorded).toBe(5)
    expect(summary.byStatus.present).toBe(2)
    expect(summary.byStatus.absent).toBe(1)
    expect(summary.byStatus.excused).toBe(1)
    expect(summary.byStatus.partial).toBe(1)
    expect(summary.byStatus.sick).toBe(0)
  })

  it('includes invalid legacy statuses in totalRecorded only', () => {
    const summary = summarizeAttendanceByStatus('child_1', ['present', 'late', 'excused_absence'])
    expect(summary.totalRecorded).toBe(3)
    expect(summary.byStatus.present).toBe(1)
    expect(summary.byStatus.partial).toBe(0)
  })
})
