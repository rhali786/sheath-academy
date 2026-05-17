export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'partial'
  | 'excused'
  | 'sick'
  | 'holiday'
  | 'field_trip'
  | 'coop'
  | 'makeup'
  | 'not_school'

export type AttendanceType =
  | 'regular'
  | 'field_trip'
  | 'coop'
  | 'tutor'
  | 'masjid'
  | 'project_day'
  | 'life_skills'

export interface AttendanceRecord {
  id: string
  childId: string
  householdId: string
  date: string
  status: AttendanceStatus
  attendanceType?: AttendanceType
  reason?: string
  notes?: string
  hours?: number
  minutes?: number
  isArchived?: boolean
  createdAt: string
  updatedAt: string
}

export interface AttendanceSummary {
  childId: string
  totalPresent: number
  totalAbsent: number
  totalPartial: number
  totalRecorded: number
  missingDays?: number
}

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  partial: 'Partial',
  excused: 'Excused absence',
  sick: 'Sick day',
  holiday: 'Holiday / break',
  field_trip: 'Field trip',
  coop: 'Co-op day',
  makeup: 'Makeup day',
  not_school: 'Not a school day',
}
