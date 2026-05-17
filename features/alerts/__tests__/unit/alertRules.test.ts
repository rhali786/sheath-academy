import { getAlerts } from '@/features/alerts/server/service'

jest.mock('@/features/planner/server/service', () => ({
  getLessons: jest.fn(),
}))

jest.mock('@/features/attendance/server/service', () => ({
  getRecords: jest.fn(),
}))

jest.mock('@/features/children/server/service', () => ({
  getStudentProfiles: jest.fn(),
}))

import { getLessons } from '@/features/planner/server/service'
import { getRecords } from '@/features/attendance/server/service'
import { getStudentProfiles } from '@/features/children/server/service'

const mockGetLessons = getLessons as jest.Mock
const mockGetRecords = getRecords as jest.Mock
const mockGetProfiles = getStudentProfiles as jest.Mock

const TODAY = new Date().toISOString().slice(0, 10)
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

const activeAdam = { id: 'adam_01', name: 'Adam', isActive: true, householdId: 'hh_01', gradeLabel: 'Grade 5', username: 'adam', password: '', createdAt: '' }
const activeKhadijah = { id: 'khadijah_01', name: 'Khadijah', isActive: true, householdId: 'hh_01', gradeLabel: 'Grade 3', username: 'khadijah', password: '', createdAt: '' }
const archivedZayd = { id: 'zayd_01', name: 'Zayd', isActive: false, householdId: 'hh_01', gradeLabel: 'Grade 8', username: 'zayd', password: '', createdAt: '' }

beforeEach(() => {
  mockGetProfiles.mockReturnValue([activeAdam, activeKhadijah, archivedZayd])
  mockGetLessons.mockReturnValue([])
  mockGetRecords.mockReturnValue([])
})

describe('getAlerts — unit tests', () => {
  test('returns no alerts when all children have completed lessons and attendance', () => {
    mockGetLessons.mockImplementation((childId?: string) =>
      childId === activeAdam.id || !childId
        ? [{ id: 'l1', childId: activeAdam.id, title: 'Math', status: 'completed', dueDate: TODAY, subjectId: 's1' }]
        : []
    )
    mockGetRecords.mockReturnValue([
      { childId: activeAdam.id, date: TODAY, status: 'present' },
      { childId: activeKhadijah.id, date: TODAY, status: 'present' },
    ])

    const alerts = getAlerts()
    expect(alerts.filter(a => a.id.startsWith('pending_lessons'))).toHaveLength(0)
    expect(alerts.filter(a => a.id.startsWith('attendance_missing'))).toHaveLength(0)
  })

  test('produces a pending lessons alert for a child with overdue lessons', () => {
    mockGetLessons.mockImplementation((childId?: string) =>
      !childId || childId === activeAdam.id
        ? [{ id: 'l1', childId: activeAdam.id, title: 'Fractions', status: 'not_started', dueDate: YESTERDAY, subjectId: 's1' }]
        : []
    )
    mockGetRecords.mockReturnValue([
      { childId: activeAdam.id, date: TODAY, status: 'present' },
      { childId: activeKhadijah.id, date: TODAY, status: 'present' },
    ])

    const alerts = getAlerts()
    const adamAlert = alerts.find(a => a.childId === activeAdam.id)
    expect(adamAlert).toBeDefined()
    expect(adamAlert?.message).toMatch(/overdue/i)
    expect(adamAlert?.severity).toBe('high')
  })

  test('produces a due-today alert (not overdue) when lesson due date is today', () => {
    mockGetLessons.mockImplementation((childId?: string) =>
      !childId || childId === activeAdam.id
        ? [{ id: 'l1', childId: activeAdam.id, title: 'Reading', status: 'not_started', dueDate: TODAY, subjectId: 's1' }]
        : []
    )
    mockGetRecords.mockReturnValue([
      { childId: activeAdam.id, date: TODAY, status: 'present' },
      { childId: activeKhadijah.id, date: TODAY, status: 'present' },
    ])

    const alerts = getAlerts()
    const adamAlert = alerts.find(a => a.childId === activeAdam.id)
    expect(adamAlert).toBeDefined()
    expect(adamAlert?.message).toMatch(/due today/i)
    expect(adamAlert?.severity).toBe('medium')
  })

  test('completed lessons do not produce an alert', () => {
    mockGetLessons.mockReturnValue([
      { id: 'l1', childId: activeAdam.id, title: 'Math', status: 'completed', dueDate: TODAY, subjectId: 's1' },
      { id: 'l2', childId: activeKhadijah.id, title: 'Reading', status: 'completed', dueDate: YESTERDAY, subjectId: 's2' },
    ])
    mockGetRecords.mockReturnValue([
      { childId: activeAdam.id, date: TODAY, status: 'present' },
      { childId: activeKhadijah.id, date: TODAY, status: 'present' },
    ])

    const alerts = getAlerts()
    expect(alerts.filter(a => a.id.startsWith('pending_lessons'))).toHaveLength(0)
  })

  test('archived child does not produce active alerts', () => {
    mockGetProfiles.mockReturnValue([activeAdam, archivedZayd])
    mockGetLessons.mockImplementation((childId?: string) =>
      !childId || childId === archivedZayd.id
        ? [{ id: 'l1', childId: archivedZayd.id, title: 'Essay', status: 'not_started', dueDate: YESTERDAY, subjectId: 's1' }]
        : []
    )
    mockGetRecords.mockReturnValue([
      { childId: activeAdam.id, date: TODAY, status: 'present' },
    ])

    const alerts = getAlerts()
    const zaydAlert = alerts.find(a => a.childId === archivedZayd.id)
    expect(zaydAlert).toBeUndefined()
  })

  test('produces an attendance alert when active children have no attendance today', () => {
    mockGetLessons.mockReturnValue([])
    mockGetRecords.mockReturnValue([])

    const alerts = getAlerts()
    const attendanceAlert = alerts.find(a => a.id.startsWith('attendance_missing'))
    expect(attendanceAlert).toBeDefined()
    expect(attendanceAlert?.message).toMatch(/Adam/i)
    expect(attendanceAlert?.message).toMatch(/Khadijah/i)
  })

  test('attendance alert excludes children who have attendance logged', () => {
    mockGetLessons.mockReturnValue([])
    mockGetRecords.mockReturnValue([
      { childId: activeAdam.id, date: TODAY, status: 'present' },
    ])

    const alerts = getAlerts()
    const attendanceAlert = alerts.find(a => a.id.startsWith('attendance_missing'))
    expect(attendanceAlert).toBeDefined()
    expect(attendanceAlert?.message).toMatch(/Khadijah/i)
    expect(attendanceAlert?.message).not.toMatch(/Adam/i)
  })

  test('getAlerts filters by childId when provided', () => {
    mockGetLessons.mockImplementation(() => [
      { id: 'l1', childId: activeAdam.id, title: 'Math', status: 'not_started', dueDate: YESTERDAY, subjectId: 's1' },
      { id: 'l2', childId: activeKhadijah.id, title: 'Reading', status: 'not_started', dueDate: YESTERDAY, subjectId: 's2' },
    ])
    mockGetRecords.mockReturnValue([
      { childId: activeAdam.id, date: TODAY, status: 'present' },
      { childId: activeKhadijah.id, date: TODAY, status: 'present' },
    ])

    const adamAlerts = getAlerts(activeAdam.id)
    const childSpecificAlerts = adamAlerts.filter(a => a.childId !== null)
    expect(childSpecificAlerts.every(a => a.childId === activeAdam.id)).toBe(true)
  })
})
