import { getRecordsReport } from '@/features/records/server/service'
import { listAttendanceEvents } from '@/features/attendance/server/repository'
import { getLearner } from '@/features/children/server/repository'
import { listEvidenceRows } from '@/features/portfolio/server/repository'
import { listLessonTaskRows } from '@/features/plan/server/repository'
import { getActiveSchoolYear } from '@/features/school-year/server/service'
import { listSubjectRows } from '@/features/subjects/server/repository'

jest.mock('@/features/attendance/server/repository', () => ({
  listAttendanceEvents: jest.fn(),
}))

jest.mock('@/features/children/server/repository', () => ({
  getLearner: jest.fn(),
}))

jest.mock('@/features/portfolio/server/repository', () => ({
  listEvidenceRows: jest.fn(),
}))

jest.mock('@/features/plan/server/repository', () => ({
  listLessonTaskRows: jest.fn(),
}))

jest.mock('@/features/school-year/server/service', () => ({
  getActiveSchoolYear: jest.fn(),
}))

jest.mock('@/features/subjects/server/repository', () => ({
  listSubjectRows: jest.fn(),
}))

const mockGetLearner = getLearner as jest.Mock
const mockListAttendanceEvents = listAttendanceEvents as jest.Mock
const mockListEvidenceRows = listEvidenceRows as jest.Mock
const mockListLessonTaskRows = listLessonTaskRows as jest.Mock
const mockGetActiveSchoolYear = getActiveSchoolYear as jest.Mock
const mockListSubjectRows = listSubjectRows as jest.Mock

const HOUSEHOLD_ID = 'hh_01'
const LEARNER_ID = 'learner_01'
const SUBJECT_ID = 'subject_01'
const now = new Date('2026-01-02T00:00:00.000Z')

beforeEach(() => {
  mockGetLearner.mockResolvedValue({
    id: LEARNER_ID,
    householdId: HOUSEHOLD_ID,
    name: 'Adam',
    displayColor: null,
    gradeLevel: 'Grade 5',
    isActive: true,
    archivedAt: null,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  })
  mockGetActiveSchoolYear.mockResolvedValue({
    id: 'schoolyear_01',
    workspaceId: HOUSEHOLD_ID,
    name: '2025-2026',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    isActive: true,
    createdAt: now.toISOString(),
  })
  mockListSubjectRows.mockResolvedValue([{
    id: SUBJECT_ID,
    householdId: HOUSEHOLD_ID,
    learnerId: LEARNER_ID,
    name: 'Math',
    category: 'Math',
    description: null,
    color: null,
    sortOrder: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }])
  mockListLessonTaskRows.mockResolvedValue([{
    id: 'lesson_01',
    householdId: HOUSEHOLD_ID,
    learnerId: LEARNER_ID,
    subjectId: SUBJECT_ID,
    title: 'Fractions',
    description: null,
    notes: null,
    dueDate: '2026-01-05',
    status: 'completed',
    sortOrder: 0,
    completedAt: now,
    skippedAt: null,
    createdAt: now,
    updatedAt: now,
  }])
  mockListAttendanceEvents.mockResolvedValue([{
    id: 'attendance_01',
    householdId: HOUSEHOLD_ID,
    learnerId: LEARNER_ID,
    attendanceDate: '2026-01-05',
    occurredAt: now,
    status: 'present',
    minutes: 180,
    notes: null,
    voidedAt: null,
    createdAt: now,
    updatedAt: now,
  }])
  mockListEvidenceRows.mockResolvedValue([{
    id: 'evidence_01',
    householdId: HOUSEHOLD_ID,
    learnerId: LEARNER_ID,
    subjectId: SUBJECT_ID,
    lessonTaskId: 'lesson_01',
    quranSessionId: null,
    attendanceEventId: null,
    title: 'Worksheet',
    description: 'Completed worksheet',
    evidenceType: 'note',
    url: null,
    evidenceDate: '2026-01-05',
    createdAt: now,
    updatedAt: now,
  }])
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('getRecordsReport', () => {
  it('builds a household-scoped report from repository rows', async () => {
    const report = await getRecordsReport(HOUSEHOLD_ID, {
      childId: LEARNER_ID,
      startDate: '2026-01-01',
      endDate: '2026-01-10',
    })

    expect(mockGetLearner).toHaveBeenCalledWith(LEARNER_ID, HOUSEHOLD_ID)
    expect(mockListLessonTaskRows).toHaveBeenCalledWith(HOUSEHOLD_ID, {
      learnerId: LEARNER_ID,
      startDate: '2026-01-01',
      endDate: '2026-01-10',
    })
    expect(report.child.name).toBe('Adam')
    expect(report.subjects[0].learnerIds).toEqual([LEARNER_ID])
    expect(report.completedLessons).toHaveLength(1)
    expect(report.attendance.totalPresent).toBe(1)
    expect(report.portfolio.count).toBe(1)
  })
})
