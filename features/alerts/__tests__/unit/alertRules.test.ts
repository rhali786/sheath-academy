import { getAlerts } from '@/features/alerts/server/service'

jest.mock('@/features/children/server/repository', () => ({
  listAllLearners: jest.fn(),
}))

jest.mock('@/features/plan/server/repository', () => ({
  listLessonTaskRows: jest.fn(),
}))

jest.mock('@/features/attendance/server/repository', () => ({
  listAttendanceEvents: jest.fn(),
}))

jest.mock('@/features/gradebook/server/repository', () => ({
  listGradebookSummaries: jest.fn(),
}))

jest.mock('@/features/school-year/server/service', () => ({
  getActiveSchoolYear: jest.fn(),
}))

jest.mock('@/features/compliance/server/repository', () => ({
  listDeadlines: jest.fn(),
}))

import { listAllLearners } from '@/features/children/server/repository'
import { listLessonTaskRows } from '@/features/plan/server/repository'
import { listAttendanceEvents } from '@/features/attendance/server/repository'
import { listGradebookSummaries } from '@/features/gradebook/server/repository'
import { getActiveSchoolYear } from '@/features/school-year/server/service'
import { listDeadlines } from '@/features/compliance/server/repository'

const mockListAllLearners = listAllLearners as jest.Mock
const mockListLessonTaskRows = listLessonTaskRows as jest.Mock
const mockListAttendanceEvents = listAttendanceEvents as jest.Mock
const mockListGradebookSummaries = listGradebookSummaries as jest.Mock
const mockGetActiveSchoolYear = getActiveSchoolYear as jest.Mock
const mockListDeadlines = listDeadlines as jest.Mock

const HOUSEHOLD_ID = 'hh_01'

function localDateStr(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const TODAY = localDateStr(0)
const YESTERDAY = localDateStr(-1)

const activeAdam = {
  id: 'adam_01',
  householdId: HOUSEHOLD_ID,
  name: 'Adam',
  displayColor: null,
  gradeLevel: 'Grade 5',
  isActive: true,
  archivedAt: null,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const activeKhadijah = {
  id: 'khadijah_01',
  householdId: HOUSEHOLD_ID,
  name: 'Khadijah',
  displayColor: null,
  gradeLevel: 'Grade 3',
  isActive: true,
  archivedAt: null,
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const archivedZayd = {
  id: 'zayd_01',
  householdId: HOUSEHOLD_ID,
  name: 'Zayd',
  displayColor: null,
  gradeLevel: 'Grade 8',
  isActive: false,
  archivedAt: new Date(),
  sortOrder: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function makeLesson(learnerId: string, overrides = {}) {
  return {
    id: `lesson_${learnerId}`,
    householdId: HOUSEHOLD_ID,
    learnerId,
    subjectId: 'subject_01',
    title: 'Math',
    description: null,
    notes: null,
    dueDate: TODAY,
    status: 'not_started',
    sortOrder: 0,
    completedAt: null,
    skippedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function makeAttendance(learnerId: string) {
  return {
    id: `attendance_${learnerId}`,
    householdId: HOUSEHOLD_ID,
    learnerId,
    attendanceDate: TODAY,
    status: 'present',
    minutes: null,
    notes: null,
    occurredAt: new Date(),
    voidedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function makeGradebookSummary(learnerId: string, learnerName: string, overrides = {}) {
  return {
    learnerId,
    learnerName,
    gradeBand: 'g5_8',
    subjects: [
      {
        subjectId: 'subject_math',
        label: 'Math',
        pointsAverage: null,
        masteryAverage: null,
        gradeLetter: null,
        creditHours: 1,
        needsReview: false,
      },
    ],
    gpa: { weighted: null, unweighted: null, totalCreditHours: 0 },
    needsAttentionSubjects: [] as string[],
    ...overrides,
  }
}

function makeDeadline(overrides = {}) {
  return {
    id: 'deadline_01',
    householdId: HOUSEHOLD_ID,
    schoolYearId: 'sy_01',
    label: 'File letter of intent',
    dueDate: localDateStr(3),
    isCompleted: false,
    requirementType: 'notice',
    ...overrides,
  }
}

beforeEach(() => {
  mockListAllLearners.mockResolvedValue([activeAdam, activeKhadijah, archivedZayd])
  mockListLessonTaskRows.mockResolvedValue([])
  mockListAttendanceEvents.mockResolvedValue([])
  mockListGradebookSummaries.mockResolvedValue([])
  mockGetActiveSchoolYear.mockResolvedValue(null)
  mockListDeadlines.mockResolvedValue([])
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('getAlerts - unit tests', () => {
  test('uses household-scoped repositories', async () => {
    mockListAttendanceEvents.mockResolvedValue([
      makeAttendance(activeAdam.id),
      makeAttendance(activeKhadijah.id),
    ])

    const alerts = await getAlerts(HOUSEHOLD_ID)

    expect(alerts).toHaveLength(0)
    expect(mockListAllLearners).toHaveBeenCalledWith(HOUSEHOLD_ID)
    expect(mockListLessonTaskRows).toHaveBeenCalledWith(HOUSEHOLD_ID, { learnerId: activeAdam.id, endDate: TODAY })
    expect(mockListLessonTaskRows).toHaveBeenCalledWith(HOUSEHOLD_ID, { learnerId: activeKhadijah.id, endDate: TODAY })
    expect(mockListLessonTaskRows).not.toHaveBeenCalledWith(HOUSEHOLD_ID, expect.objectContaining({ learnerId: archivedZayd.id }))
    expect(mockListAttendanceEvents).toHaveBeenCalledWith(HOUSEHOLD_ID, { date: TODAY })
  })

  test('fetches lessons for all active children in parallel (not sequentially)', async () => {
    const callOrder: string[] = []
    mockListLessonTaskRows.mockImplementation(
      async (_hh: string, filters: { learnerId?: string }) =>
        new Promise(resolve =>
          // Stagger resolutions slightly to confirm ordering doesn't matter
          setTimeout(() => { callOrder.push(filters.learnerId ?? '?'); resolve([]) }, 10)
        )
    )
    mockListAttendanceEvents.mockResolvedValue([
      makeAttendance(activeAdam.id),
      makeAttendance(activeKhadijah.id),
    ])

    await getAlerts(HOUSEHOLD_ID)

    // Both children fetched exactly once — neither blocks the other
    expect(mockListLessonTaskRows).toHaveBeenCalledTimes(2)
    expect(callOrder).toHaveLength(2)
    expect(callOrder).toContain(activeAdam.id)
    expect(callOrder).toContain(activeKhadijah.id)
  })

  test('returns no alerts when all children have completed lessons and attendance', async () => {
    mockListLessonTaskRows.mockImplementation(async (_householdId: string, filters: { learnerId?: string }) =>
      filters.learnerId === activeAdam.id
        ? [makeLesson(activeAdam.id, { id: 'l1', title: 'Math', status: 'completed' })]
        : []
    )
    mockListAttendanceEvents.mockResolvedValue([
      makeAttendance(activeAdam.id),
      makeAttendance(activeKhadijah.id),
    ])

    const alerts = await getAlerts(HOUSEHOLD_ID)
    expect(alerts.filter(a => a.id.startsWith('pending_lessons'))).toHaveLength(0)
    expect(alerts.filter(a => a.id.startsWith('attendance_missing'))).toHaveLength(0)
  })

  test('produces a pending lessons alert for a child with overdue lessons', async () => {
    mockListLessonTaskRows.mockImplementation(async (_householdId: string, filters: { learnerId?: string }) =>
      filters.learnerId === activeAdam.id
        ? [makeLesson(activeAdam.id, { id: 'l1', title: 'Fractions', dueDate: YESTERDAY })]
        : []
    )
    mockListAttendanceEvents.mockResolvedValue([
      makeAttendance(activeAdam.id),
      makeAttendance(activeKhadijah.id),
    ])

    const alerts = await getAlerts(HOUSEHOLD_ID)
    const adamAlert = alerts.find(a => a.childId === activeAdam.id)
    expect(adamAlert).toBeDefined()
    expect(adamAlert?.message).toMatch(/overdue/i)
    expect(adamAlert?.severity).toBe('high')
  })

  test('produces a due-today alert when lesson due date is today', async () => {
    mockListLessonTaskRows.mockImplementation(async (_householdId: string, filters: { learnerId?: string }) =>
      filters.learnerId === activeAdam.id
        ? [makeLesson(activeAdam.id, { id: 'l1', title: 'Reading', dueDate: TODAY })]
        : []
    )
    mockListAttendanceEvents.mockResolvedValue([
      makeAttendance(activeAdam.id),
      makeAttendance(activeKhadijah.id),
    ])

    const alerts = await getAlerts(HOUSEHOLD_ID)
    const adamAlert = alerts.find(a => a.childId === activeAdam.id)
    expect(adamAlert).toBeDefined()
    expect(adamAlert?.message).toMatch(/due today/i)
    expect(adamAlert?.severity).toBe('medium')
  })

  test('completed lessons do not produce an alert', async () => {
    mockListLessonTaskRows.mockImplementation(async (_householdId: string, filters: { learnerId?: string }) => [
      makeLesson(filters.learnerId ?? activeAdam.id, { status: 'completed', dueDate: YESTERDAY }),
    ])
    mockListAttendanceEvents.mockResolvedValue([
      makeAttendance(activeAdam.id),
      makeAttendance(activeKhadijah.id),
    ])

    const alerts = await getAlerts(HOUSEHOLD_ID)
    expect(alerts.filter(a => a.id.startsWith('pending_lessons'))).toHaveLength(0)
  })

  test('archived child does not produce active alerts', async () => {
    mockListAllLearners.mockResolvedValue([activeAdam, archivedZayd])
    mockListLessonTaskRows.mockImplementation(async (_householdId: string, filters: { learnerId?: string }) =>
      filters.learnerId === archivedZayd.id
        ? [makeLesson(archivedZayd.id, { title: 'Essay', dueDate: YESTERDAY })]
        : []
    )
    mockListAttendanceEvents.mockResolvedValue([makeAttendance(activeAdam.id)])

    const alerts = await getAlerts(HOUSEHOLD_ID)
    const zaydAlert = alerts.find(a => a.childId === archivedZayd.id)
    expect(zaydAlert).toBeUndefined()
  })

  test('produces a household attendance alert when active children have no attendance today', async () => {
    const alerts = await getAlerts(HOUSEHOLD_ID)
    const attendanceAlert = alerts.find(a => a.id.startsWith('attendance_missing'))
    expect(attendanceAlert).toBeDefined()
    expect(attendanceAlert?.message).toMatch(/Adam/i)
    expect(attendanceAlert?.message).toMatch(/Khadijah/i)
    expect(attendanceAlert?.childId).toBeNull()
    expect(attendanceAlert?.href).toBe('/attendance')
  })

  test('attendance alert excludes children who have attendance logged', async () => {
    mockListAttendanceEvents.mockResolvedValue([makeAttendance(activeAdam.id)])

    const alerts = await getAlerts(HOUSEHOLD_ID)
    const attendanceAlert = alerts.find(a => a.id.startsWith('attendance_missing'))
    expect(attendanceAlert).toBeDefined()
    expect(attendanceAlert?.message).toMatch(/Khadijah/i)
    expect(attendanceAlert?.message).not.toMatch(/Adam/i)
  })

  test('getAlerts filters by childId when provided', async () => {
    mockListLessonTaskRows.mockImplementation(async (_householdId: string, filters: { learnerId?: string }) => [
      makeLesson(filters.learnerId ?? activeAdam.id, { dueDate: YESTERDAY }),
    ])
    mockListAttendanceEvents.mockResolvedValue([
      makeAttendance(activeAdam.id),
      makeAttendance(activeKhadijah.id),
    ])

    const adamAlerts = await getAlerts(HOUSEHOLD_ID, activeAdam.id)
    const childSpecificAlerts = adamAlerts.filter(a => a.childId !== null)
    expect(childSpecificAlerts.every(a => a.childId === activeAdam.id)).toBe(true)
    expect(mockListLessonTaskRows).toHaveBeenCalledTimes(1)
    expect(mockListLessonTaskRows).toHaveBeenCalledWith(HOUSEHOLD_ID, { learnerId: activeAdam.id, endDate: TODAY })
  })

  test('child-scoped lesson alert href includes childId query param', async () => {
    mockListLessonTaskRows.mockImplementation(async (_householdId: string, filters: { learnerId?: string }) =>
      filters.learnerId === activeAdam.id
        ? [makeLesson(activeAdam.id, { title: 'Math', dueDate: YESTERDAY })]
        : []
    )
    mockListAttendanceEvents.mockResolvedValue([
      makeAttendance(activeAdam.id),
      makeAttendance(activeKhadijah.id),
    ])

    const alerts = await getAlerts(HOUSEHOLD_ID)
    const adamAlert = alerts.find(a => a.childId === activeAdam.id && a.type === 'pending_lessons')
    expect(adamAlert).toBeDefined()
    expect(adamAlert?.href).toBe(`/lessons?childId=${activeAdam.id}`)
  })

  test('child-scoped attendance alert href includes childId query param', async () => {
    const alerts = await getAlerts(HOUSEHOLD_ID, activeKhadijah.id)
    const attendanceAlert = alerts.find(a => a.id.startsWith('attendance_missing'))
    expect(attendanceAlert).toBeDefined()
    expect(attendanceAlert?.href).toBe(`/attendance?childId=${activeKhadijah.id}`)
    expect(attendanceAlert?.childId).toBe(activeKhadijah.id)
  })
})

describe('getAlerts - gradebook emitters', () => {
  beforeEach(() => {
    // Silence attendance/lesson noise so gradebook alerts are isolated.
    mockListAttendanceEvents.mockResolvedValue([
      makeAttendance(activeAdam.id),
      makeAttendance(activeKhadijah.id),
    ])
  })

  test('emits a gradebook alert (sourceFeature "gradebook") for a learner with a needsAttention subject', async () => {
    mockListGradebookSummaries.mockResolvedValue([
      makeGradebookSummary(activeAdam.id, 'Adam', { needsAttentionSubjects: ['subject_math'] }),
    ])

    const alerts = await getAlerts(HOUSEHOLD_ID)
    const gradebookAlert = alerts.find(a => a.sourceFeature === 'gradebook')
    expect(gradebookAlert).toBeDefined()
    expect(gradebookAlert?.childId).toBe(activeAdam.id)
    expect(gradebookAlert?.href).toBe(`/growth/gradebook?childId=${activeAdam.id}`)
    expect(gradebookAlert?.severity).toBe('medium')
  })

  test('emits no gradebook alert when there are no needsAttention flags', async () => {
    mockListGradebookSummaries.mockResolvedValue([
      makeGradebookSummary(activeAdam.id, 'Adam', { needsAttentionSubjects: [] }),
    ])

    const alerts = await getAlerts(HOUSEHOLD_ID)
    expect(alerts.filter(a => a.sourceFeature === 'gradebook')).toHaveLength(0)
  })

  test('gradebook alerts respect the childId filter', async () => {
    mockListGradebookSummaries.mockResolvedValue([
      makeGradebookSummary(activeAdam.id, 'Adam', { needsAttentionSubjects: ['subject_math'] }),
      makeGradebookSummary(activeKhadijah.id, 'Khadijah', { needsAttentionSubjects: ['subject_math'] }),
    ])

    const alerts = await getAlerts(HOUSEHOLD_ID, activeAdam.id)
    const gradebookAlerts = alerts.filter(a => a.sourceFeature === 'gradebook')
    expect(gradebookAlerts).toHaveLength(1)
    expect(gradebookAlerts[0].childId).toBe(activeAdam.id)
  })
})

describe('getAlerts - compliance emitters', () => {
  beforeEach(() => {
    mockListAttendanceEvents.mockResolvedValue([
      makeAttendance(activeAdam.id),
      makeAttendance(activeKhadijah.id),
    ])
  })

  test('emits a compliance alert (sourceFeature "compliance") for a not-completed deadline within the due-soon window', async () => {
    mockGetActiveSchoolYear.mockResolvedValue({ id: 'sy_01' })
    mockListDeadlines.mockResolvedValue([makeDeadline({ dueDate: localDateStr(3), isCompleted: false })])

    const alerts = await getAlerts(HOUSEHOLD_ID)
    const complianceAlert = alerts.find(a => a.sourceFeature === 'compliance')
    expect(complianceAlert).toBeDefined()
    expect(complianceAlert?.href).toBe('/compliance')
    expect(complianceAlert?.childId).toBeNull()
    expect(mockListDeadlines).toHaveBeenCalledWith(HOUSEHOLD_ID, 'sy_01')
  })

  test('emits no compliance alert when the deadline is completed', async () => {
    mockGetActiveSchoolYear.mockResolvedValue({ id: 'sy_01' })
    mockListDeadlines.mockResolvedValue([makeDeadline({ dueDate: localDateStr(3), isCompleted: true })])

    const alerts = await getAlerts(HOUSEHOLD_ID)
    expect(alerts.filter(a => a.sourceFeature === 'compliance')).toHaveLength(0)
  })

  test('emits no compliance alert when the deadline is far out of the due-soon window', async () => {
    mockGetActiveSchoolYear.mockResolvedValue({ id: 'sy_01' })
    mockListDeadlines.mockResolvedValue([makeDeadline({ dueDate: localDateStr(60), isCompleted: false })])

    const alerts = await getAlerts(HOUSEHOLD_ID)
    expect(alerts.filter(a => a.sourceFeature === 'compliance')).toHaveLength(0)
  })

  test('emits no compliance alert when there is no active school year', async () => {
    mockGetActiveSchoolYear.mockResolvedValue(null)
    mockListDeadlines.mockResolvedValue([makeDeadline({ dueDate: localDateStr(3), isCompleted: false })])

    const alerts = await getAlerts(HOUSEHOLD_ID)
    expect(alerts.filter(a => a.sourceFeature === 'compliance')).toHaveLength(0)
    expect(mockListDeadlines).not.toHaveBeenCalled()
  })
})

describe('getAlerts - schedule imbalance', () => {
  beforeEach(() => {
    mockListAttendanceEvents.mockResolvedValue([
      makeAttendance(activeAdam.id),
      makeAttendance(activeKhadijah.id),
    ])
  })

  test('emits a schedule-imbalance alert when a subject is scheduled >=2x on today for a learner', async () => {
    mockListLessonTaskRows.mockImplementation(async (_householdId: string, filters: { learnerId?: string }) =>
      filters.learnerId === activeAdam.id
        ? [
            makeLesson(activeAdam.id, { id: 'l1', subjectId: 'subject_math', dueDate: TODAY, status: 'completed' }),
            makeLesson(activeAdam.id, { id: 'l2', subjectId: 'subject_math', dueDate: TODAY, status: 'completed' }),
          ]
        : []
    )

    const alerts = await getAlerts(HOUSEHOLD_ID)
    const imbalance = alerts.find(a => a.type === 'schedule_imbalance')
    expect(imbalance).toBeDefined()
    expect(imbalance?.childId).toBe(activeAdam.id)
    expect(imbalance?.sourceFeature).toBe('planner')
  })

  test('emits no schedule-imbalance alert when no subject is doubled today', async () => {
    mockListLessonTaskRows.mockImplementation(async (_householdId: string, filters: { learnerId?: string }) =>
      filters.learnerId === activeAdam.id
        ? [
            makeLesson(activeAdam.id, { id: 'l1', subjectId: 'subject_math', dueDate: TODAY, status: 'completed' }),
            makeLesson(activeAdam.id, { id: 'l2', subjectId: 'subject_reading', dueDate: TODAY, status: 'completed' }),
          ]
        : []
    )

    const alerts = await getAlerts(HOUSEHOLD_ID)
    expect(alerts.filter(a => a.type === 'schedule_imbalance')).toHaveLength(0)
  })
})
