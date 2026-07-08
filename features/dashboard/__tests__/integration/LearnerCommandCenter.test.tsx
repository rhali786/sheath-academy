import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { HouseholdProvider } from '@/features/household/front/context'
import { LearnerProvider, useLearner } from '@/features/layout/front/context/LearnerContext'
import { LearnerCommandCenter } from '@/features/dashboard/front/components/LearnerCommandCenter'

jest.mock('@/features/household/front/services/api', () => ({
  householdApi: {
    getProfile: jest.fn(() =>
      Promise.resolve({
        data: { id: 'hh_1', familyName: 'Test Family', createdAt: '2026-01-01T00:00:00.000Z' },
        status: 'success',
        message: '',
        timestamp: '',
      })
    ),
  },
}))

const mockGetAllChildren = jest.fn()
jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getAllChildren: (...args: unknown[]) => mockGetAllChildren(...args),
  },
}))

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: {
    getSubjects: jest.fn(() => Promise.resolve({ data: [] })),
  },
}))

const mockGetSummary = jest.fn()
jest.mock('@/features/attendance/front/services/api', () => ({
  attendanceApi: {
    getSummary: (...args: unknown[]) => mockGetSummary(...args),
  },
}))

const mockGetLessons = jest.fn()
jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    getLessons: (...args: unknown[]) => mockGetLessons(...args),
  },
}))

const mockGetSummaries = jest.fn()
jest.mock('@/features/gradebook/front/services/api', () => ({
  gradebookApi: {
    getSummaries: (...args: unknown[]) => mockGetSummaries(...args),
  },
}))

function SelectedChildProbe() {
  const { selectedChildId } = useLearner()
  return <div data-testid="selected-child-probe">{selectedChildId ?? 'none'}</div>
}

function renderCenter() {
  return render(
    <LearnerProvider>
      <HouseholdProvider>
        <LearnerCommandCenter />
        <SelectedChildProbe />
      </HouseholdProvider>
    </LearnerProvider>
  )
}

const learner1 = {
  id: 'c1',
  householdId: 'hh_1',
  name: 'Amina',
  gradeLabel: '4',
  username: 'amina',
  password: '',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const learner2 = {
  id: 'c2',
  householdId: 'hh_1',
  name: 'Bilal',
  gradeLabel: '6',
  username: 'bilal',
  password: '',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const emptyAttendanceSummary = (childId: string) => ({
  data: {
    childId,
    totalRecorded: 0,
    byStatus: {
      present: 0,
      absent: 0,
      partial: 0,
      excused: 0,
      sick: 0,
      holiday: 0,
      field_trip: 0,
      coop: 0,
      makeup: 0,
      not_school: 0,
    },
  },
})

function lesson(id: string, childId: string, status: 'completed' | 'not_started' | 'skipped') {
  return {
    id,
    childId,
    subjectId: 's1',
    householdId: 'hh_1',
    title: 'Lesson',
    dueDate: '2026-07-08',
    status,
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

// Reset per CLAUDE.md testing gotchas: LearnerContext persists selectedChildId to
// sessionStorage and does not clear between tests — an earlier test's selection can
// leak into a later one in the same file.
beforeEach(() => {
  sessionStorage.clear()
  mockGetAllChildren.mockReset()
  mockGetSummary.mockReset()
  mockGetLessons.mockReset()
  mockGetSummaries.mockReset()
})

describe('LearnerCommandCenter', () => {
  it('shows a loading state while household/learner data is being fetched', async () => {
    mockGetAllChildren.mockReturnValue(new Promise(() => {}))

    renderCenter()

    expect(screen.getByTestId('learner-command-center-loading')).toBeInTheDocument()
  })

  it('renders an empty state when there are no active learners', async () => {
    mockGetAllChildren.mockResolvedValue({ data: [] })

    renderCenter()

    await waitFor(() => {
      expect(screen.getByTestId('learner-command-center-empty')).toBeInTheDocument()
    })
  })

  it('renders an error state when a metrics fetch fails', async () => {
    mockGetAllChildren.mockResolvedValue({ data: [learner1] })
    mockGetSummaries.mockResolvedValue({ data: [] })
    mockGetSummary.mockRejectedValue(new Error('network error'))
    mockGetLessons.mockResolvedValue([])

    renderCenter()

    await waitFor(() => {
      expect(screen.getByTestId('learner-command-center-error')).toBeInTheDocument()
    })
  })

  it('renders one row per active learner with attendance %, today lessons X/Y, and a current grade', async () => {
    mockGetAllChildren.mockResolvedValue({ data: [learner1, learner2] })
    mockGetSummaries.mockResolvedValue({
      data: [
        {
          learnerId: 'c1',
          learnerName: 'Amina',
          gradeBand: 'g1_4',
          subjects: [],
          gpa: { weighted: null, unweighted: null, totalCreditHours: 0 },
          needsAttentionSubjects: [],
          overallMastery: 88.5,
        },
        {
          learnerId: 'c2',
          learnerName: 'Bilal',
          gradeBand: 'g5_8',
          subjects: [],
          gpa: { weighted: null, unweighted: null, totalCreditHours: 0 },
          needsAttentionSubjects: [],
          overallMastery: 72,
        },
      ],
    })
    mockGetSummary.mockImplementation((childId: string) => {
      if (childId === 'c1') {
        return Promise.resolve({
          data: {
            childId: 'c1',
            totalRecorded: 4,
            byStatus: { present: 3, absent: 1, partial: 0, excused: 0, sick: 0, holiday: 0, field_trip: 0, coop: 0, makeup: 0, not_school: 0 },
          },
        })
      }
      return Promise.resolve(emptyAttendanceSummary(childId))
    })
    mockGetLessons.mockImplementation((_week: unknown, childIds: string[]) => {
      if (childIds[0] === 'c1') {
        return Promise.resolve([lesson('l1', 'c1', 'completed'), lesson('l2', 'c1', 'not_started')])
      }
      return Promise.resolve([])
    })

    renderCenter()

    await waitFor(() => {
      expect(screen.getByTestId('learner-command-center')).toBeInTheDocument()
    })

    expect(screen.getByText('Amina')).toBeInTheDocument()
    expect(screen.getByText('Bilal')).toBeInTheDocument()

    // Amina: 3/4 present -> 75%, 1/2 lessons completed today, overallMastery 88.5
    expect(screen.getByTestId('learner-command-row-c1-attendance')).toHaveTextContent('75%')
    expect(screen.getByTestId('learner-command-row-c1-lessons')).toHaveTextContent('1/2')
    expect(screen.getByTestId('learner-command-row-c1-grade')).toHaveTextContent('88.5')
  })

  it("renders '—' for metrics with no data rather than crashing or showing a fake number", async () => {
    mockGetAllChildren.mockResolvedValue({ data: [learner2] })
    mockGetSummaries.mockResolvedValue({ data: [] })
    mockGetSummary.mockResolvedValue(emptyAttendanceSummary('c2'))
    mockGetLessons.mockResolvedValue([])

    renderCenter()

    await waitFor(() => {
      expect(screen.getByTestId('learner-command-center')).toBeInTheDocument()
    })

    expect(screen.getByTestId('learner-command-row-c2-attendance')).toHaveTextContent('—')
    expect(screen.getByTestId('learner-command-row-c2-lessons')).toHaveTextContent('—')
    expect(screen.getByTestId('learner-command-row-c2-grade')).toHaveTextContent('—')
  })

  it('clicking a learner row calls setSelectedChildId and scopes the dashboard to that learner', async () => {
    mockGetAllChildren.mockResolvedValue({ data: [learner1, learner2] })
    mockGetSummaries.mockResolvedValue({ data: [] })
    mockGetSummary.mockResolvedValue(emptyAttendanceSummary('c1'))
    mockGetLessons.mockResolvedValue([])

    renderCenter()

    await waitFor(() => {
      expect(screen.getByTestId('learner-command-center')).toBeInTheDocument()
    })

    expect(screen.getByTestId('selected-child-probe')).toHaveTextContent('none')

    fireEvent.click(screen.getByTestId('learner-command-row-c2'))

    await waitFor(() => {
      expect(screen.getByTestId('selected-child-probe')).toHaveTextContent('c2')
    })
  })
})
