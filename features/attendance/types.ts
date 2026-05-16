export type AttendanceStatus = 'present' | 'absent' | 'partial'

export interface AttendanceRecord {
  id: string
  childId: string
  householdId: string
  date: string
  status: AttendanceStatus
  notes?: string
  hours?: number
  minutes?: number
  createdAt: string
  updatedAt: string
}

export interface AttendanceSummary {
  childId: string
  totalPresent: number
  totalAbsent: number
  totalPartial: number
  totalRecorded: number
}
