import { AttendanceRecord, AttendanceSummary, AttendanceStatus } from '../types'
import { attendanceStore } from './store'
import { SEED_ATTENDANCE } from './seed'
import { generateAttendanceId, resetIdCounter } from './ids'
import { getStudentProfile } from '@/features/children/server/service'

const VALID_STATUSES: AttendanceStatus[] = ['present', 'absent', 'partial']

export function isValidStatus(s: unknown): s is AttendanceStatus {
  return VALID_STATUSES.includes(s as AttendanceStatus)
}

interface RecordFilters {
  childId?: string
  date?: string
  startDate?: string
  endDate?: string
}

export function getRecords(filters: RecordFilters = {}): AttendanceRecord[] {
  let records = attendanceStore.getAll()

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

export function updateRecord(id: string, patch: Partial<AttendanceRecord>): AttendanceRecord | null {
  const record = attendanceStore.getById(id)
  if (!record) return null

  const allowed: Partial<AttendanceRecord> = {}
  if (patch.status !== undefined) allowed.status = patch.status
  if (patch.notes !== undefined) allowed.notes = patch.notes
  if (patch.hours !== undefined) allowed.hours = patch.hours
  if (patch.minutes !== undefined) allowed.minutes = patch.minutes
  if (patch.date !== undefined) allowed.date = patch.date
  allowed.updatedAt = new Date().toISOString()

  return attendanceStore.update(id, allowed)
}

export function deleteRecord(id: string): boolean {
  const record = attendanceStore.getById(id)
  if (!record) return false
  return attendanceStore.remove(id)
}

export function getAttendanceSummary(childId: string, startDate?: string, endDate?: string): AttendanceSummary {
  const filters: RecordFilters = { childId }
  if (startDate) filters.startDate = startDate
  if (endDate) filters.endDate = endDate

  const records = getRecords(filters)

  const totalPresent = records.filter(r => r.status === 'present').length
  const totalAbsent = records.filter(r => r.status === 'absent').length
  const totalPartial = records.filter(r => r.status === 'partial').length

  return {
    childId,
    totalPresent,
    totalAbsent,
    totalPartial,
    totalRecorded: totalPresent + totalAbsent + totalPartial,
  }
}

export function resetStore(): void {
  attendanceStore.reset(SEED_ATTENDANCE)
  resetIdCounter()
}
