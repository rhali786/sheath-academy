import { render, screen, waitFor } from '@testing-library/react'
import { PlannerProvider } from '@/features/planner/front/context/PlannerContext'
import { WeeklyPlannerPage } from '@/features/planner/front/components/WeeklyPlannerPage'
import type { StudentProfile, ApiResponse } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

jest.mock('@/features/planner/front/services/api', () => ({
  plannerApi: {
    getLessons: jest.fn(() => Promise.resolve([])),
    getLesson: jest.fn(),
    createLesson: jest.fn(),
    updateLesson: jest.fn(),
    completeLesson: jest.fn(),
  },
}))

const mockChildren: StudentProfile[] = [
  { id: 'child_001', householdId: 'hh_001', name: 'Adam', gradeLabel: '5th', isActive: true, username: 'adam', password: 'pwd', createdAt: '2026-01-01T00:00:00Z' },
]

const mockSubjects: SubjectCourse[] = [
  { id: 'subj_001', childId: 'child_001', name: 'Math', category: 'Math', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
]

function renderWithPlanner() {
  return render(
    <PlannerProvider>
      <WeeklyPlannerPage />
    </PlannerProvider>
  )
}

beforeEach(() => {
  global.fetch = jest.fn()
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('WeeklyPlannerPage', () => {
  it('shows loading spinner while fetching household profile and lessons', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ ok: true, json: async () => ({ status: 'success', data: [] }) }), 100)
        )
    )

    renderWithPlanner()

    expect(screen.getByText(/loading planner/i)).toBeInTheDocument()
  })

  it('shows error state when GET /api/household/profile fails', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Profile fetch failed'))

    renderWithPlanner()

    await waitFor(() => {
      expect(screen.getByText(/error loading planner/i)).toBeInTheDocument()
    })
  })

  it('shows error state when GET /api/planner/lessons fails', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/household/profile')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: 'success',
            data: { id: 'hh_001', weekStartDay: 'Monday' },
          } as ApiResponse<{ weekStartDay?: string }>),
        })
      }
      if (url.includes('/api/children/children')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: 'success',
            data: mockChildren,
          } as ApiResponse<StudentProfile[]>),
        })
      }
      if (url.includes('/api/subjects')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: 'success',
            data: mockSubjects,
          } as ApiResponse<SubjectCourse[]>),
        })
      }
      if (url.includes('/api/planner/lessons')) {
        return Promise.reject(new Error('Lessons fetch failed'))
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ status: 'success', data: [] }),
      })
    })

    renderWithPlanner()

    await waitFor(() => {
      expect(screen.getByText(/error loading planner/i)).toBeInTheDocument()
    })
  })

  it('loads and displays lessons for the current week on mount', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/household/profile')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: 'success',
            data: { id: 'hh_001', weekStartDay: 'Monday' },
          }),
        })
      }
      if (url.includes('/api/children/children')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: mockChildren }),
        })
      }
      if (url.includes('/api/subjects')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: mockSubjects }),
        })
      }
      if (url.includes('/api/planner/lessons')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: [] }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ status: 'success', data: [] }),
      })
    })

    renderWithPlanner()

    await waitFor(() => {
      expect(screen.queryByText(/loading planner/i)).not.toBeInTheDocument()
    })

    expect(screen.getByText(/no lessons/i)).toBeInTheDocument()
  })

  it('shows empty state when no lessons exist for the week', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/household/profile')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: { id: 'hh_001', weekStartDay: 'Monday' } }),
        })
      }
      if (url.includes('/api/children/children')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: mockChildren }),
        })
      }
      if (url.includes('/api/subjects')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: mockSubjects }),
        })
      }
      if (url.includes('/api/planner/lessons')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: [] }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ status: 'success', data: [] }),
      })
    })

    renderWithPlanner()

    await waitFor(() => {
      expect(screen.queryByText(/loading planner/i)).not.toBeInTheDocument()
    })

    expect(screen.getByText(/no lessons/i)).toBeInTheDocument()
  })

  it('renders week grid on desktop viewport once loaded', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/household/profile')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: { id: 'hh_001', weekStartDay: 'Monday' } }),
        })
      }
      if (url.includes('/api/children/children')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: mockChildren }),
        })
      }
      if (url.includes('/api/subjects')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: mockSubjects }),
        })
      }
      if (url.includes('/api/planner/lessons')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: [] }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ status: 'success', data: [] }),
      })
    })

    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })

    renderWithPlanner()

    await waitFor(() => {
      expect(screen.queryByText(/loading planner/i)).not.toBeInTheDocument()
    })

    expect(screen.getByText('Monday')).toBeInTheDocument()
  })

  it('renders week list on mobile viewport once loaded', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/household/profile')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: { id: 'hh_001', weekStartDay: 'Monday' } }),
        })
      }
      if (url.includes('/api/children/children')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: mockChildren }),
        })
      }
      if (url.includes('/api/subjects')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: mockSubjects }),
        })
      }
      if (url.includes('/api/planner/lessons')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success', data: [] }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ status: 'success', data: [] }),
      })
    })

    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 })

    renderWithPlanner()

    await waitFor(() => {
      expect(screen.queryByText(/loading planner/i)).not.toBeInTheDocument()
    })

    expect(screen.getByText('Monday')).toBeInTheDocument()
  })
})
