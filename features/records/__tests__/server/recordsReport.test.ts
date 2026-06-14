import { getRecordsReport } from '@/features/records/server/service'
import { listAttendanceEvents } from '@/features/attendance/server/repository'
import { getLearner } from '@/features/children/server/repository'
import { listEvidenceRows } from '@/features/portfolio/server/repository'
import { listFinalizedSessionRows } from '@/features/learning-time/server/repository'
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

jest.mock('@/features/learning-time/server/repository', () => ({
  listFinalizedSessionRows: jest.fn(),
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
const mockListFinalizedSessionRows = listFinalizedSessionRows as jest.Mock
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
  mockListFinalizedSessionRows.mockResolvedValue([])
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
    expect(report.attendance.byStatus.present).toBe(1)
    expect(report.portfolio.count).toBe(1)
  })
})

function sessionRow(overrides: Partial<{
  id: string
  subjectId: string | null
  startedAt: Date
  endedAt: Date
}>) {
  return {
    id: overrides.id ?? 'lts_01',
    householdId: HOUSEHOLD_ID,
    learnerId: LEARNER_ID,
    subjectId: overrides.subjectId ?? null,
    lessonTaskId: null,
    timeChannelType: 'stopwatch',
    targetMinutes: null,
    scheduledStart: null,
    scheduledEnd: null,
    status: 'finalized',
    startedAt: overrides.startedAt ?? now,
    pausedAt: null,
    endedAt: overrides.endedAt ?? now,
    endedBy: 'manual',
    outcome: 'complete',
    notes: null,
    createdAt: now,
    updatedAt: now,
  }
}

describe('getRecordsReport — timeBySubject', () => {
  it('aggregates finalized session minutes by subject into timeBySubject', async () => {
    mockListFinalizedSessionRows.mockResolvedValue([
      sessionRow({
        id: 'lts_01',
        subjectId: SUBJECT_ID,
        startedAt: new Date('2026-01-05T10:00:00.000Z'),
        endedAt: new Date('2026-01-05T10:30:00.000Z'),
      }),
      sessionRow({
        id: 'lts_02',
        subjectId: SUBJECT_ID,
        startedAt: new Date('2026-01-06T10:00:00.000Z'),
        endedAt: new Date('2026-01-06T10:45:00.000Z'),
      }),
    ])

    const report = await getRecordsReport(HOUSEHOLD_ID, {
      childId: LEARNER_ID,
      startDate: '2026-01-01',
      endDate: '2026-01-10',
    })

    expect(report.timeBySubject).toEqual([
      { subjectId: SUBJECT_ID, subjectName: 'Math', totalMinutes: 75 },
    ])
  })

  it('groups sessions with no subjectId under an "Unassigned" entry, sorted last', async () => {
    mockListFinalizedSessionRows.mockResolvedValue([
      sessionRow({
        id: 'lts_01',
        subjectId: SUBJECT_ID,
        startedAt: new Date('2026-01-05T10:00:00.000Z'),
        endedAt: new Date('2026-01-05T10:30:00.000Z'),
      }),
      sessionRow({
        id: 'lts_02',
        subjectId: null,
        startedAt: new Date('2026-01-06T10:00:00.000Z'),
        endedAt: new Date('2026-01-06T10:20:00.000Z'),
      }),
    ])

    const report = await getRecordsReport(HOUSEHOLD_ID, {
      childId: LEARNER_ID,
      startDate: '2026-01-01',
      endDate: '2026-01-10',
    })

    expect(report.timeBySubject).toEqual([
      { subjectId: SUBJECT_ID, subjectName: 'Math', totalMinutes: 30 },
      { subjectId: null, subjectName: 'Unassigned', totalMinutes: 20 },
    ])
  })

  it('includes a session finalized during the last day of the range (end-of-day boundary)', async () => {
    mockListFinalizedSessionRows.mockResolvedValue([
      sessionRow({
        id: 'lts_01',
        subjectId: SUBJECT_ID,
        startedAt: new Date('2026-01-31T17:30:00.000Z'),
        endedAt: new Date('2026-01-31T18:00:00.000Z'),
      }),
    ])

    const report = await getRecordsReport(HOUSEHOLD_ID, {
      childId: LEARNER_ID,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    })

    expect(mockListFinalizedSessionRows).toHaveBeenCalledWith(HOUSEHOLD_ID, {
      learnerId: LEARNER_ID,
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-31T23:59:59.999Z',
    })
    expect(report.timeBySubject).toEqual([
      { subjectId: SUBJECT_ID, subjectName: 'Math', totalMinutes: 30 },
    ])
  })

  it('returns an empty timeBySubject array when there are no finalized sessions in range', async () => {
    mockListFinalizedSessionRows.mockResolvedValue([])

    const report = await getRecordsReport(HOUSEHOLD_ID, {
      childId: LEARNER_ID,
      startDate: '2026-01-01',
      endDate: '2026-01-10',
    })

    expect(report.timeBySubject).toEqual([])
  })
})
