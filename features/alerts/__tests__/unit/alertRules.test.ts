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

import { listAllLearners } from '@/features/children/server/repository'
import { listLessonTaskRows } from '@/features/plan/server/repository'
import { listAttendanceEvents } from '@/features/attendance/server/repository'

const mockListAllLearners = listAllLearners as jest.Mock
const mockListLessonTaskRows = listLessonTaskRows as jest.Mock
const mockListAttendanceEvents = listAttendanceEvents as jest.Mock

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

beforeEach(() => {
  mockListAllLearners.mockResolvedValue([activeAdam, activeKhadijah, archivedZayd])
  mockListLessonTaskRows.mockResolvedValue([])
  mockListAttendanceEvents.mockResolvedValue([])
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
    expect(mockListLessonTaskRows).toHaveBeenCalledWith(HOUSEHOLD_ID, { learnerId: activeAdam.id })
    expect(mockListLessonTaskRows).toHaveBeenCalledWith(HOUSEHOLD_ID, { learnerId: activeKhadijah.id })
    expect(mockListLessonTaskRows).not.toHaveBeenCalledWith(HOUSEHOLD_ID, { learnerId: archivedZayd.id })
    expect(mockListAttendanceEvents).toHaveBeenCalledWith(HOUSEHOLD_ID, { date: TODAY })
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
    expect(mockListLessonTaskRows).toHaveBeenCalledWith(HOUSEHOLD_ID, { learnerId: activeAdam.id })
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
