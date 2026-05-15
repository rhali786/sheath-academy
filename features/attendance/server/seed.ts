import { AttendanceRecord } from '../types'
import { SEED_IDS } from '@/features/lib/seedIds'

function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function getMondayOfCurrentWeek(): Date {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysFromMonday)
}

const weekMonday = getMondayOfCurrentWeek()

function dateForOffset(offset: number): string {
  const d = new Date(weekMonday.getFullYear(), weekMonday.getMonth(), weekMonday.getDate() + offset)
  return formatLocalDate(d)
}

export const SEED_ATTENDANCE: AttendanceRecord[] = [
  // Adam — Mon present, Tue present, Wed absent, Thu present
  {
    id: 'attendance_seed_001',
    childId: SEED_IDS.adam,
    householdId: SEED_IDS.household,
    date: dateForOffset(0),
    status: 'present',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'attendance_seed_002',
    childId: SEED_IDS.adam,
    householdId: SEED_IDS.household,
    date: dateForOffset(1),
    status: 'present',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'attendance_seed_003',
    childId: SEED_IDS.adam,
    householdId: SEED_IDS.household,
    date: dateForOffset(2),
    status: 'absent',
    notes: 'Unwell',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'attendance_seed_004',
    childId: SEED_IDS.adam,
    householdId: SEED_IDS.household,
    date: dateForOffset(3),
    status: 'present',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // Khadijah — Mon present, Tue partial (3h 30m), Wed present
  {
    id: 'attendance_seed_005',
    childId: SEED_IDS.khadijah,
    householdId: SEED_IDS.household,
    date: dateForOffset(0),
    status: 'present',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'attendance_seed_006',
    childId: SEED_IDS.khadijah,
    householdId: SEED_IDS.household,
    date: dateForOffset(1),
    status: 'partial',
    hours: 3,
    minutes: 30,
    notes: 'Dentist appointment afternoon',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'attendance_seed_007',
    childId: SEED_IDS.khadijah,
    householdId: SEED_IDS.household,
    date: dateForOffset(2),
    status: 'present',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // Zayd — Mon present, Tue present
  {
    id: 'attendance_seed_008',
    childId: SEED_IDS.zayd,
    householdId: SEED_IDS.household,
    date: dateForOffset(0),
    status: 'present',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'attendance_seed_009',
    childId: SEED_IDS.zayd,
    householdId: SEED_IDS.household,
    date: dateForOffset(1),
    status: 'present',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
]
