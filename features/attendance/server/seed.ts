import { AttendanceRecord } from '../types'
import { SEED_IDS } from '@/features/lib/seedIds'

function pad(n: number) { return String(n).padStart(2, '0') }
function fmt(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

function getMondayOfCurrentWeek(): Date {
  const today = new Date()
  const dow = today.getDay()
  const offset = dow === 0 ? 6 : dow - 1
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)
}

function dateForWeekDay(weeksBack: number, dayOffset: number): string {
  const monday = getMondayOfCurrentWeek()
  const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - weeksBack * 7 + dayOffset)
  return fmt(d)
}

type AttendanceStatus = 'present' | 'absent' | 'partial'

interface DayConfig {
  status: AttendanceStatus
  hours?: number
  minutes?: number
  notes?: string
}

// Per-child per-week attendance plans (Mon-Fri = dayOffset 0-4)
// weeksBack: 0=current, 1=last, 2=two weeks ago, 3=three weeks ago

const PLANS: Record<string, DayConfig[][]> = {
  // Layth — 4th grade, solid attendance, one sick day each month
  [SEED_IDS.layth]: [
    // current week
    [{status:'present'},{status:'present'},{status:'present'},{status:'present'},{status:'present'}],
    // last week
    [{status:'present'},{status:'present'},{status:'absent',notes:'Doctor appointment'},{status:'present'},{status:'present'}],
    // 2 weeks ago
    [{status:'present'},{status:'partial',hours:4,minutes:0,notes:'Left early for appointment'},{status:'present'},{status:'present'},{status:'present'}],
    // 3 weeks ago
    [{status:'present'},{status:'present'},{status:'present'},{status:'present'},{status:'absent',notes:'Unwell'}],
  ],
  // Hawa — 1st grade, good attendance, occasional short days
  [SEED_IDS.hawa]: [
    [{status:'present'},{status:'present'},{status:'present'},{status:'partial',hours:3,minutes:30,notes:'Dentist afternoon'},{status:'present'}],
    [{status:'present'},{status:'present'},{status:'present'},{status:'present'},{status:'present'}],
    [{status:'present'},{status:'absent',notes:'Flu'},{status:'absent',notes:'Flu'},{status:'present'},{status:'present'}],
    [{status:'present'},{status:'present'},{status:'partial',hours:4,minutes:30,notes:'Early pick-up'},{status:'present'},{status:'present'}],
  ],
  // Talut — 7th grade, excellent attendance
  [SEED_IDS.talut]: [
    [{status:'present'},{status:'present'},{status:'present'},{status:'present'},{status:'present'}],
    [{status:'present'},{status:'present'},{status:'present'},{status:'present'},{status:'present'}],
    [{status:'present'},{status:'present'},{status:'present'},{status:'absent',notes:'Family event'},{status:'present'}],
    [{status:'present'},{status:'present'},{status:'present'},{status:'present'},{status:'present'}],
  ],
  // Samurai — 4th grade, very consistent
  [SEED_IDS.samurai]: [
    [{status:'present'},{status:'present'},{status:'present'},{status:'present'},{status:'present'}],
    [{status:'present'},{status:'partial',hours:5,minutes:0,notes:'Late start'},{status:'present'},{status:'present'},{status:'present'}],
    [{status:'present'},{status:'present'},{status:'present'},{status:'present'},{status:'present'}],
    [{status:'present'},{status:'present'},{status:'absent',notes:'Unwell'},{status:'present'},{status:'present'}],
  ],
}

let idx = 1
const records: AttendanceRecord[] = []

for (const [childId, weeks] of Object.entries(PLANS)) {
  for (let weeksBack = 0; weeksBack < weeks.length; weeksBack++) {
    const week = weeks[weeksBack]
    for (let day = 0; day < 5; day++) {
      const cfg = week[day]
      records.push({
        id: `attendance_seed_${String(idx++).padStart(3, '0')}`,
        childId,
        householdId: SEED_IDS.household,
        date: dateForWeekDay(weeksBack, day),
        status: cfg.status,
        hours: cfg.hours,
        minutes: cfg.minutes,
        notes: cfg.notes,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })
    }
  }
}

export const SEED_ATTENDANCE: AttendanceRecord[] = records
