import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlannerProvider } from '@/features/plan/front/context/PlannerContext'
import { WeeklyPlannerPage } from '@/features/plan/front/components/WeeklyPlannerPage'
import { LearnerProvider } from '@/features/layout/front/context/LearnerContext'
import type { StudentProfile, ApiResponse } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'
import type { LessonTask } from '@/features/plan/types'

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
    getLessons: jest.fn(() => Promise.resolve(mockLessons)),
    getLesson: jest.fn(),
    createLesson: jest.fn(),
    updateLesson: jest.fn(),
    completeLesson: jest.fn(),
  },
}))

jest.mock('@/features/settings/front/services/api', () => ({
  settingsApi: {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
  },
}))

const mockRouterPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

import { useHousehold } from '@/features/household/front/context'
import { settingsApi } from '@/features/settings/front/services/api'

const mockUseHousehold = useHousehold as jest.Mock
const mockGetSettings = settingsApi.getSettings as jest.Mock
const mockUpdateSettings = settingsApi.updateSettings as jest.Mock

const mockChildren: StudentProfile[] = [
  { id: 'child_001', householdId: 'hh_001', name: 'Adam', gradeLabel: '5th', isActive: true, username: 'adam', password: 'pwd', createdAt: '2026-01-01T00:00:00Z' },
]

const mockSubjects: SubjectCourse[] = [
  { id: 'subj_001', childId: 'child_001', name: 'Math', category: 'Math', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
]

const mockLessons: LessonTask[] = [
  {
    id: 'lesson_001',
    childId: 'child_001',
    subjectId: 'subj_001',
    title: 'Fractions',
    status: 'not_started',
    dueDate: '2026-07-13T00:00:00Z',
    plannedStartDate: '2026-07-13T00:00:00Z',
  } as LessonTask,
]

function renderWithPlanner() {
  return render(
    <LearnerProvider>
      <PlannerProvider>
        <WeeklyPlannerPage />
      </PlannerProvider>
    </LearnerProvider>,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
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
  mockGetSettings.mockResolvedValue({
    status: 'success',
    data: {},
    message: 'ok',
    timestamp: '',
  })
  mockUpdateSettings.mockResolvedValue({
    status: 'success',
    data: {},
    message: 'ok',
    timestamp: '',
  })
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

describe('PlannerViewToggle', () => {
  it('renders with two options: Weekly Planner and Planning Matrix', async () => {
    renderWithPlanner()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /weekly planner/i })).toBeInTheDocument()
    })
    expect(screen.getByRole('tab', { name: /planning matrix/i })).toBeInTheDocument()
  })

  it('defaults to the Weekly Planner view when no preference is saved', async () => {
    renderWithPlanner()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /weekly planner/i })).toHaveAttribute('aria-selected', 'true')
    })
    expect(screen.getByRole('tab', { name: /planning matrix/i })).toHaveAttribute('aria-selected', 'false')
    // matrix-only element must not be present when defaulted to planner view
    expect(screen.queryByText('Child / Subject')).not.toBeInTheDocument()
  })

  it('selecting Planning Matrix renders the existing WeekGrid', async () => {
    renderWithPlanner()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /planning matrix/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('tab', { name: /planning matrix/i }))

    await waitFor(() => {
      expect(screen.getByText('Child / Subject')).toBeInTheDocument()
    })
  })

  it('selecting Weekly Planner renders the lesson-centric list view', async () => {
    renderWithPlanner()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /planning matrix/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('tab', { name: /planning matrix/i }))
    await waitFor(() => {
      expect(screen.getByText('Child / Subject')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('tab', { name: /weekly planner/i }))

    await waitFor(() => {
      expect(screen.queryByText('Child / Subject')).not.toBeInTheDocument()
    })
    // WeeklyList-specific content: day-of-week sections, not the matrix table.
    expect(screen.getByText('Monday')).toBeInTheDocument()
  })

  it('renders a Calendar option that navigates to the calendar view without changing the saved planner view', async () => {
    renderWithPlanner()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /weekly planner/i })).toBeInTheDocument()
    })

    const calendarTab = screen.getByRole('tab', { name: /calendar/i })
    expect(calendarTab).toBeInTheDocument()

    await userEvent.click(calendarTab)

    // Calendar is a navigation to the existing /plan/schedule calendar, not an in-page view.
    expect(mockRouterPush).toHaveBeenCalledWith('/plan/schedule')
    // It must NOT persist 'calendar' as the planner's saved planner/matrix preference.
    expect(mockUpdateSettings).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'planner.defaultView': 'calendar' }),
    )
  })

  it('persists the selected view across a remount', async () => {
    const { unmount } = renderWithPlanner()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /planning matrix/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('tab', { name: /planning matrix/i }))

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({ 'planner.defaultView': 'matrix' })
    })

    unmount()

    mockGetSettings.mockResolvedValue({
      status: 'success',
      data: { 'planner.defaultView': 'matrix' },
      message: 'ok',
      timestamp: '',
    })

    renderWithPlanner()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /planning matrix/i })).toHaveAttribute('aria-selected', 'true')
    })
    expect(screen.getByText('Child / Subject')).toBeInTheDocument()
  })
})
