import { getAttendanceSummary, getRecords as getAttendanceRecords } from '@/features/attendance/server/service'
import { getStudentProfile } from '@/features/children/server/service'
import { listEvidenceItems } from '@/features/portfolio/server/service'
import { getLessons } from '@/features/plan/server/service'
import { getCompletedLessonHistory } from '@/features/plan/utils/completedLessonHistory'
import { computeProgressBySubject } from '@/features/plan/utils/progressBySubject'
import { getActiveSchoolYear } from '@/features/school-year/server/service'
import { getSubjects } from '@/features/subjects/server/service'
import type { RecordsChecklistItem, RecordsReport, RecordsReportOptions, ReportDateRange } from '../types'

function defaultDateRange(options: RecordsReportOptions): ReportDateRange {
  const activeYear = getActiveSchoolYear()
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

export function getRecordsReport(options: RecordsReportOptions): RecordsReport {
  const child = getStudentProfile(options.childId)
  if (!child) {
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

  const dateRange = defaultDateRange(options)
  const subjects = getSubjects(options.childId).filter(subject => subject.isActive)
  const lessons = getLessons(options.childId)
  const completedLessons = getCompletedLessonHistory(lessons, {
    childId: options.childId,
    startDate: dateRange.start,
    endDate: dateRange.end,
  })
  const attendanceRecords = getAttendanceRecords({
    childId: options.childId,
    startDate: dateRange.start,
    endDate: dateRange.end,
  })
  const attendance = getAttendanceSummary(options.childId, dateRange.start, dateRange.end)
  const evidence = listEvidenceItems({
    childId: options.childId,
    startDate: dateRange.start,
    endDate: dateRange.end,
  })

  const childNames = { [child.id]: child.name }
  const subjectNames = Object.fromEntries(subjects.map(subject => [subject.id, subject.name]))
  const progressBySubject = computeProgressBySubject(
    lessons,
    dateRange,
    [options.childId],
    childNames,
    subjectNames,
    'year'
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
    checklist: buildChecklist({
      expectedAttendanceDays: countWeekdays(dateRange.start, dateRange.end),
      recordedAttendanceDays: new Set(attendanceRecords.map(record => record.date)).size,
      subjectsWithoutCompletedWork,
      portfolioCount: evidence.length,
    }),
    generatedAt: new Date().toISOString(),
  }
}
