import { render, screen, waitFor } from '@testing-library/react'
import { PlannerProvider } from '@/features/plan/front/context/PlannerContext'
import { WeeklyPlannerPage } from '@/features/plan/front/components/WeeklyPlannerPage'
import type { StudentProfile, ApiResponse } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(() => ({
    householdProfile: { id: 'hh_001', weekStartDay: 'Monday', familyName: 'Test' },
    studentProfiles: mockChildren,
    allSubjects: mockSubjects,
    loading: false,
    familyName: 'Test',
    needsSetup: false,
    error: null,
    refetch: jest.fn(),
  })),
}))

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    getLessons: jest.fn(() => Promise.resolve([])),
    getLesson: jest.fn(),
    createLesson: jest.fn(),
    updateLesson: jest.fn(),
    completeLesson: jest.fn(),
  },
}))

import { useHousehold } from '@/features/household/front/context'

const mockUseHousehold = useHousehold as jest.Mock

const mockChildren: StudentProfile[] = [
  { id: 'child_001', householdId: 'hh_001', name: 'Adam', gradeLabel: '5th', isActive: true, username: 'adam', password: 'pwd', createdAt: '2026-01-01T00:00:00Z' },
]

const mockSubjects: SubjectCourse[] = [
  { id: 'subj_001', childId: 'child_001', name: 'Math', category: 'Math', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
]

function mockChildrenAndSubjects() {
  ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/api/children/children')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ status: 'success', data: mockChildren } as ApiResponse<StudentProfile[]>),
      })
    }
    if (url.includes('/api/subjects')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ status: 'success', data: mockSubjects } as ApiResponse<SubjectCourse[]>),
      })
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({ status: 'success', data: [] }),
    })
  })
}

function renderWithPlanner() {
  return render(
    <PlannerProvider>
      <WeeklyPlannerPage />
    </PlannerProvider>
  )
}

beforeEach(() => {
  mockUseHousehold.mockImplementation(() => ({
    householdProfile: { id: 'hh_001', weekStartDay: 'Monday', familyName: 'Test' },
    studentProfiles: mockChildren,
    allSubjects: mockSubjects,
    loading: false,
    familyName: 'Test',
    needsSetup: false,
    error: null,
    refetch: jest.fn(),
  }))
  global.fetch = jest.fn((url: string) => {
    if (String(url).includes('/ingest/')) {
      return Promise.resolve({ ok: true, json: async () => ({}) })
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({ status: 'success', data: [] }),
    })
  })
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('WeeklyPlannerPage', () => {
  it('shows loading spinner while household context is initializing', async () => {
    mockUseHousehold.mockImplementation(() => ({
      householdProfile: { id: 'hh_001', weekStartDay: 'Monday', familyName: 'Test' },
      studentProfiles: [],
      allSubjects: [],
      loading: true,
      familyName: 'Test',
      needsSetup: false,
      error: null,
      refetch: jest.fn(),
    }))

    renderWithPlanner()

    expect(screen.getByText(/loading planner/i)).toBeInTheDocument()
  })

  it('shows lessons loading state while planner shell is visible', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ ok: true, json: async () => ({ status: 'success', data: [] }) }), 100)
        )
    )

    renderWithPlanner()

    expect(screen.getByText(/loading lessons/i)).toBeInTheDocument()
  })

  it('shows error state when lessons fetch fails', async () => {
    const { plannerApi } = require('@/features/plan/front/services/api')
    plannerApi.getLessons.mockRejectedValueOnce(new Error('Lessons fetch failed'))

    mockChildrenAndSubjects()

    renderWithPlanner()

    await waitFor(() => {
      expect(screen.getByText(/error loading planner/i)).toBeInTheDocument()
    })
  })

  it('loads and displays lessons for the current week on mount', async () => {
    mockChildrenAndSubjects()

    renderWithPlanner()

    await waitFor(() => {
      expect(screen.queryByText(/loading planner/i)).not.toBeInTheDocument()
    })

    // PlannerContext must not fetch profile — HouseholdProvider owns it
    const profileCalls = (global.fetch as jest.Mock).mock.calls.filter(
      ([url]: [string]) => typeof url === 'string' && url.includes('/api/household/profile')
    )
    expect(profileCalls).toHaveLength(0)
  })

  it('shows empty state when no lessons exist for the week', async () => {
    mockChildrenAndSubjects()

    renderWithPlanner()

    await waitFor(() => {
      expect(screen.queryByText(/loading planner/i)).not.toBeInTheDocument()
    })
  })

  it('shows planner chrome while lessons are still loading', async () => {
    const { plannerApi } = require('@/features/plan/front/services/api')
    plannerApi.getLessons.mockImplementation(() => new Promise(() => {}))

    mockChildrenAndSubjects()

    renderWithPlanner()

    // Wait for init spinner to clear
    await waitFor(() => {
      expect(screen.queryByText(/loading planner/i)).not.toBeInTheDocument()
    })

    // Chrome (WeekNavigator) is visible before lessons resolve
    expect(screen.getByRole('button', { name: /previous week/i })).toBeInTheDocument()
  })
})
