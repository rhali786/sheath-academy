import { listAttendanceEvents, type AttendanceEventRow } from '@/features/attendance/server/repository'
import { summarizeAttendanceByStatus } from '@/features/attendance/server/summarize'
import type { AttendanceRecord, AttendanceStatus } from '@/features/attendance/types'
import { getLearner, type LearnerRow } from '@/features/children/server/repository'
import type { StudentProfile } from '@/features/lib/types'
import { listEvidenceRows, type EvidenceRow } from '@/features/portfolio/server/repository'
import type { EvidenceItem, EvidenceType } from '@/features/portfolio/types'
import { listFinalizedSessionRows } from '@/features/learning-time/server/repository'
import { listLessonTaskRows, type LessonTaskRow } from '@/features/plan/server/repository'
import type { LessonTask, LessonTaskStatus } from '@/features/plan/types'
import { getCompletedLessonHistory } from '@/features/plan/utils/completedLessonHistory'
import { computeProgressBySubject } from '@/features/plan/utils/progressBySubject'
import { getActiveSchoolYear } from '@/features/school-year/server/service'
import { listSubjectRows, type SubjectRow } from '@/features/subjects/server/repository'
import type { SubjectCourse, SubjectCourseCategory } from '@/features/subjects/types'
import type { RecordsChecklistItem, RecordsReport, RecordsReportOptions, ReportDateRange, TimeBySubject } from '../types'

async function defaultDateRange(
  householdId: string,
  options: RecordsReportOptions,
): Promise<ReportDateRange> {
  const activeYear = await getActiveSchoolYear(householdId)
  return {
    start: options.startDate ?? activeYear?.startDate ?? new Date().toISOString().slice(0, 10),
    end: options.endDate ?? activeYear?.endDate ?? new Date().toISOString().slice(0, 10),
  }
}

function countWeekdays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${endDate}T00:00:00Z`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return 0

  let count = 0
  const current = new Date(start)
  while (current <= end) {
    const day = current.getUTCDay()
    if (day !== 0 && day !== 6) count += 1
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return count
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value
}

function mapLearner(row: LearnerRow): StudentProfile {
  return {
    id: row.id,
    householdId: row.householdId,
    name: row.name,
    gradeLabel: row.gradeLevel ?? '',
    username: '',
    password: '',
    isActive: row.isActive,
    createdAt: toIso(row.createdAt),
  }
}

function mapSubject(row: SubjectRow): SubjectCourse {
  const childId = row.learnerId ?? ''
  return {
    id: row.id,
    childId,
    learnerIds: childId ? [childId] : [],
    name: row.name,
    category: row.category as SubjectCourseCategory,
    isActive: row.isActive,
    order: row.sortOrder,
    createdAt: toIso(row.createdAt),
  }
}

function mapLesson(row: LessonTaskRow): LessonTask {
  return {
    id: row.id,
    childId: row.learnerId,
    subjectId: row.subjectId ?? '',
    householdId: row.householdId,
    title: row.title,
    description: row.description ?? undefined,
    dueDate: row.dueDate ?? '',
    status: row.status as LessonTaskStatus,
    order: row.sortOrder,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

function mapAttendance(row: AttendanceEventRow): AttendanceRecord {
  return {
    id: row.id,
    childId: row.learnerId,
    householdId: row.householdId,
    date: row.attendanceDate,
    status: row.status as AttendanceStatus,
    notes: row.notes ?? undefined,
    minutes: row.minutes ?? undefined,
    hours: row.minutes === null ? undefined : row.minutes / 60,
    isArchived: row.voidedAt !== null,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

function mapEvidence(row: EvidenceRow): EvidenceItem {
  return {
    id: row.id,
    title: row.title,
    childId: row.learnerId,
    subjectId: row.subjectId ?? '',
    date: row.evidenceDate,
    type: row.evidenceType as EvidenceType,
    notes: row.description ?? undefined,
    url: row.url ?? undefined,
    lessonTaskId: row.lessonTaskId ?? undefined,
    createdBy: row.householdId,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

function buildTimeBySubject(
  rows: { subjectId: string | null; startedAt: Date | null; endedAt: Date | null }[],
  subjectNames: Record<string, string>,
): TimeBySubject[] {
  const totals = new Map<string | null, number>()
  for (const row of rows) {
    if (!row.startedAt || !row.endedAt) continue
    const minutes = (row.endedAt.getTime() - row.startedAt.getTime()) / 60000
    totals.set(row.subjectId, (totals.get(row.subjectId) ?? 0) + minutes)
  }
  return Array.from(totals.entries())
    .map(([subjectId, minutes]) => ({
      subjectId,
      subjectName: subjectId ? subjectNames[subjectId] ?? 'Unassigned' : 'Unassigned',
      totalMinutes: Math.round(minutes),
    }))
    .sort((a, b) => {
      if (a.subjectId === null) return 1
      if (b.subjectId === null) return -1
      return a.subjectName.localeCompare(b.subjectName)
    })
}

function summarizeAttendance(childId: string, records: AttendanceRecord[]) {
  return summarizeAttendanceByStatus(
    childId,
    records.map(record => record.status),
  )
}

function buildChecklist(params: {
  expectedAttendanceDays: number
  recordedAttendanceDays: number
  subjectsWithoutCompletedWork: string[]
  portfolioCount: number
}): RecordsChecklistItem[] {
  const items: RecordsChecklistItem[] = []

  if (params.recordedAttendanceDays < params.expectedAttendanceDays) {
    const missing = params.expectedAttendanceDays - params.recordedAttendanceDays
    items.push({
      id: 'missing_attendance_records',
      label: 'Missing attendance records',
      detail: `${missing} weekday(s) in this date range do not have attendance records yet.`,
      severity: 'warning',
      blocking: false,
    })
  }

  if (params.subjectsWithoutCompletedWork.length > 0) {
    items.push({
      id: 'subjects_without_completed_work',
      label: 'Subjects without completed work',
      detail: `${params.subjectsWithoutCompletedWork.join(', ')} do not have completed lessons in this date range.`,
      severity: 'warning',
      blocking: false,
    })
  }

  if (params.portfolioCount === 0) {
    items.push({
      id: 'no_portfolio_evidence',
      label: 'No portfolio evidence yet',
      detail: 'Add at least one note or link to preserve proof of learning for this child.',
      severity: 'info',
      blocking: false,
    })
  }

  return items
}

export async function getRecordsReport(
  householdId: string,
  options: RecordsReportOptions,
): Promise<RecordsReport> {
  const childRow = await getLearner(options.childId, householdId)
  if (!childRow) {
    throw new Error('Child not found')
  }

  const today = new Date().toISOString().slice(0, 10)
  if (options.startDate && options.startDate > today) {
    throw new Error('Start date cannot be in the future')
  }
  if (options.endDate && options.endDate > today) {
    throw new Error('End date cannot be in the future')
  }
  if (options.startDate && options.endDate && options.startDate > options.endDate) {
    throw new Error('Start date must be on or before end date')
  }

  const dateRange = await defaultDateRange(householdId, options)
  const child = mapLearner(childRow)
  const subjectRows = await listSubjectRows(householdId, options.childId)
  const subjects = subjectRows.map(mapSubject).filter(subject => subject.isActive)
  const lessonRows = await listLessonTaskRows(householdId, {
    learnerId: options.childId,
    startDate: dateRange.start,
    endDate: dateRange.end,
  })
  const lessons = lessonRows.map(mapLesson)
  const completedLessons = getCompletedLessonHistory(lessons, {
    childId: options.childId,
    startDate: dateRange.start,
    endDate: dateRange.end,
  })
  const attendanceRecords = (
    await listAttendanceEvents(householdId, {
      learnerId: options.childId,
      startDate: dateRange.start,
      endDate: dateRange.end,
    })
  ).map(mapAttendance)
  const attendance = summarizeAttendance(options.childId, attendanceRecords)
  const evidence = (
    await listEvidenceRows(householdId, {
      learnerId: options.childId,
      startDate: dateRange.start,
      endDate: dateRange.end,
    })
  ).map(mapEvidence)
  const sessionRows = await listFinalizedSessionRows(householdId, {
    learnerId: options.childId,
    from: `${dateRange.start}T00:00:00.000Z`,
    to: `${dateRange.end}T23:59:59.999Z`,
  })

  const childNames = { [child.id]: child.name }
  const subjectNames = Object.fromEntries(subjects.map(subject => [subject.id, subject.name]))
  const timeBySubject = buildTimeBySubject(sessionRows, subjectNames)
  const progressBySubject = computeProgressBySubject(
    lessons,
    dateRange,
    [options.childId],
    childNames,
    subjectNames,
    'year',
  )

  const subjectsWithoutCompletedWork = subjects
    .filter(subject => !completedLessons.some(lesson => lesson.subjectId === subject.id))
    .map(subject => subject.name)

  return {
    child,
    dateRange,
    subjects,
    attendance,
    completedLessons,
    progressBySubject,
    portfolio: {
      count: evidence.length,
      items: evidence,
    },
    timeBySubject,
    checklist: buildChecklist({
      expectedAttendanceDays: countWeekdays(dateRange.start, dateRange.end),
      recordedAttendanceDays: new Set(attendanceRecords.map(record => record.date)).size,
      subjectsWithoutCompletedWork,
      portfolioCount: evidence.length,
    }),
    generatedAt: new Date().toISOString(),
  }
}
