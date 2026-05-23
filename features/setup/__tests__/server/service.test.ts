import { getSetupStatus } from '@/features/setup/server/service'
import { listAttendanceEvents } from '@/features/attendance/server/repository'
import { listAllLearners } from '@/features/children/server/repository'
import { getHouseholdById } from '@/features/household/server/repository'
import { listEvidenceRows } from '@/features/portfolio/server/repository'
import { listLessonTaskRows } from '@/features/plan/server/repository'
import { listSubjectRows } from '@/features/subjects/server/repository'

jest.mock('@/features/attendance/server/repository', () => ({
  listAttendanceEvents: jest.fn(),
}))

jest.mock('@/features/children/server/repository', () => ({
  listAllLearners: jest.fn(),
}))

jest.mock('@/features/household/server/repository', () => ({
  getHouseholdById: jest.fn(),
}))

jest.mock('@/features/portfolio/server/repository', () => ({
  listEvidenceRows: jest.fn(),
}))

jest.mock('@/features/plan/server/repository', () => ({
  listLessonTaskRows: jest.fn(),
}))

jest.mock('@/features/subjects/server/repository', () => ({
  listSubjectRows: jest.fn(),
}))

const mockGetHouseholdById = getHouseholdById as jest.Mock
const mockListAllLearners = listAllLearners as jest.Mock
const mockListAttendanceEvents = listAttendanceEvents as jest.Mock
const mockListEvidenceRows = listEvidenceRows as jest.Mock
const mockListLessonTaskRows = listLessonTaskRows as jest.Mock
const mockListSubjectRows = listSubjectRows as jest.Mock

const HOUSEHOLD_ID = 'hh_01'

beforeEach(() => {
  mockGetHouseholdById.mockResolvedValue({ id: HOUSEHOLD_ID })
  mockListAllLearners.mockResolvedValue([{ id: 'learner_01', isActive: true }])
  mockListSubjectRows.mockResolvedValue([{ id: 'subject_01', isActive: true }])
  mockListLessonTaskRows.mockResolvedValue([])
  mockListAttendanceEvents.mockResolvedValue([])
  mockListEvidenceRows.mockResolvedValue([])
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('getSetupStatus', () => {
  it('uses household-scoped repositories to calculate setup progress', async () => {
    const status = await getSetupStatus(HOUSEHOLD_ID)

    expect(mockGetHouseholdById).toHaveBeenCalledWith(HOUSEHOLD_ID)
    expect(mockListAllLearners).toHaveBeenCalledWith(HOUSEHOLD_ID)
    expect(mockListSubjectRows).toHaveBeenCalledWith(HOUSEHOLD_ID)
    expect(mockListLessonTaskRows).toHaveBeenCalledWith(HOUSEHOLD_ID)
    expect(mockListAttendanceEvents).toHaveBeenCalledWith(HOUSEHOLD_ID)
    expect(mockListEvidenceRows).toHaveBeenCalledWith(HOUSEHOLD_ID)
    expect(status.nextStep).toBe('firstLesson')
    expect(status.completed).toEqual(['household', 'firstChild', 'firstSubject'])
  })
})
