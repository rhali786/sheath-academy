import { AttendanceRecord, AttendanceSummary, AttendanceStatus } from '../types'
import { attendanceStore } from './store'
import { SEED_ATTENDANCE } from './seed'
import { generateAttendanceId, resetIdCounter } from './ids'
import { getStudentProfile } from '@/features/children/server/service'

export const ALL_STATUSES: AttendanceStatus[] = [
  'present', 'absent', 'partial', 'excused', 'sick', 'holiday', 'field_trip', 'coop', 'makeup', 'not_school',
]

export function isValidStatus(s: unknown): s is AttendanceStatus {
  return ALL_STATUSES.includes(s as AttendanceStatus)
}

interface RecordFilters {
  childId?: string
  date?: string
  startDate?: string
  endDate?: string
  excludeArchived?: boolean
}

export function getRecords(filters: RecordFilters = {}): AttendanceRecord[] {
  let records = attendanceStore.getAll()

  if (filters.excludeArchived !== false) {
    records = records.filter(r => !r.isArchived)
  }
  if (filters.childId) {
    records = records.filter(r => r.childId === filters.childId)
  }
  if (filters.date) {
    records = records.filter(r => r.date === filters.date)
  }
  if (filters.startDate) {
    records = records.filter(r => r.date >= filters.startDate!)
  }
  if (filters.endDate) {
    records = records.filter(r => r.date <= filters.endDate!)
  }

  return records.sort((a, b) => b.date.localeCompare(a.date))
}

export function getRecord(id: string): AttendanceRecord | undefined {
  return attendanceStore.getById(id)
}

export function createRecord(
  data: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>
): AttendanceRecord | null {
  const student = getStudentProfile(data.childId)
  if (!student) return null

  const record: AttendanceRecord = {
    ...data,
    id: generateAttendanceId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return attendanceStore.insert(record)
}

export function createOrUpdateRecord(
  data: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>
): AttendanceRecord | null {
  const student = getStudentProfile(data.childId)
  if (!student) return null

  const existing = attendanceStore.getAll().find(
    r => r.childId === data.childId && r.date === data.date && !r.isArchived
  )

  if (existing) {
    return attendanceStore.update(existing.id, {
      status: data.status,
      attendanceType: data.attendanceType,
      reason: data.reason,
      notes: data.notes,
      hours: data.hours,
      minutes: data.minutes,
      updatedAt: new Date().toISOString(),
    })
  }

  const record: AttendanceRecord = {
    ...data,
    id: generateAttendanceId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  return attendanceStore.insert(record)
}

export function updateRecord(id: string, patch: Partial<AttendanceRecord>): AttendanceRecord | null {
  const record = attendanceStore.getById(id)
  if (!record) return null

  const allowed: Partial<AttendanceRecord> = {}
  if (patch.status !== undefined) allowed.status = patch.status
  if (patch.attendanceType !== undefined) allowed.attendanceType = patch.attendanceType
  if (patch.reason !== undefined) allowed.reason = patch.reason
  if (patch.notes !== undefined) allowed.notes = patch.notes
  if (patch.hours !== undefined) allowed.hours = patch.hours
  if (patch.minutes !== undefined) allowed.minutes = patch.minutes
  if (patch.date !== undefined) allowed.date = patch.date
  allowed.updatedAt = new Date().toISOString()

  return attendanceStore.update(id, allowed)
}

export function archiveRecord(id: string): boolean {
  const record = attendanceStore.getById(id)
  if (!record) return false
  return !!attendanceStore.update(id, { isArchived: true, updatedAt: new Date().toISOString() })
}

export function deleteRecord(id: string): boolean {
  const record = attendanceStore.getById(id)
  if (!record) return false
  return attendanceStore.remove(id)
}

function countWeekdays(start: string, end: string): number {
  const startDate = new Date(start + 'T00:00:00')
  const endDate = new Date(end + 'T00:00:00')
  let count = 0
  const cur = new Date(startDate)
  while (cur <= endDate) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getAttendanceSummary(
  childId: string,
  startDate?: string,
  endDate?: string
): AttendanceSummary {
  const filters: RecordFilters = { childId }
  if (startDate) filters.startDate = startDate
  if (endDate) filters.endDate = endDate

  const records = getRecords(filters)

  const totalPresent = records.filter(r => r.status === 'present').length
  const totalAbsent = records.filter(r => r.status === 'absent').length
  const totalPartial = records.filter(r => r.status === 'partial').length

  let missingDays: number | undefined
  if (startDate) {
    const effectiveEnd = endDate && endDate < todayISO() ? endDate : todayISO()
    const weekdays = countWeekdays(startDate, effectiveEnd)
    const schoolDayRecords = records.filter(r => r.status !== 'not_school').length
    missingDays = Math.max(0, weekdays - schoolDayRecords)
  }

  return {
    childId,
    totalPresent,
    totalAbsent,
    totalPartial,
    totalRecorded: records.length,
    missingDays,
  }
}

export function archiveByChildId(_childId: string): void {}

export function resetStore(seed?: AttendanceRecord[]): void {
  attendanceStore.reset(seed ?? SEED_ATTENDANCE)
  resetIdCounter()
}
