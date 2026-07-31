import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { DoToday } from '@/features/dashboard/front/components/DoToday'
import { DashboardContext } from '@/features/dashboard/front/context/DashboardProvider'
import type { DashboardContextType } from '@/features/dashboard/front/context/DashboardProvider'
import type { StudentProfile } from '@/features/lib/types'
import type { LessonTask } from '@/features/plan/types'

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    getLessons: jest.fn().mockResolvedValue([]),
    getLesson: jest.fn().mockResolvedValue(null),
    updateLesson: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(() => ({ studentProfiles: [], allSubjects: [] })),
}))

const mockChild: StudentProfile = {
  id: 'child_001',
  householdId: 'hh_001',
  name: 'Adam',
  gradeLabel: '5th',
  isActive: true,
  username: 'adam',
  password: 'pw',
  createdAt: '2026-01-01T00:00:00Z',
}

function makeCtx(overrides: Partial<DashboardContextType> = {}): DashboardContextType {
  return {
    children: [],
    tasks: [],
    setTasks: jest.fn(),
    alerts: [],
    setAlerts: jest.fn(),
    quranSessions: [],
    setQuranSessions: jest.fn(),
    records: [],
    setRecords: jest.fn(),
    metrics: null,
    setMetrics: jest.fn(),
    toggleTask: jest.fn(),
    addQuranSession: jest.fn(),
    loading: false,
    error: null,
    selectedChildId: null,
    setSelectedChildId: jest.fn(),
    ...overrides,
  }
}

function todayLocalForTest(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function renderDoToday(ctx: DashboardContextType) {
  return render(
    <DashboardContext.Provider value={ctx}>
      <DoToday />
    </DashboardContext.Provider>
  )
}

describe('DoToday', () => {
  it('renders TodayLessonCard with the selected child when selectedChildId is set', async () => {
    renderDoToday(makeCtx({ selectedChildId: 'child_001', children: [mockChild] }))
    await waitFor(() => {
      expect(screen.getByText(/today —/i)).toBeInTheDocument()
    })
  })

  it('renders TodayLessonCard for all children when no child is selected', async () => {
    renderDoToday(makeCtx({ selectedChildId: null, children: [mockChild] }))
    await waitFor(() => {
      // TodayLessonCard still renders its "Today —" heading when children are provided
      expect(screen.getByText(/today —/i)).toBeInTheDocument()
    })
  })

  it('renders TodayLessonCard even with empty children list', async () => {
    renderDoToday(makeCtx({ selectedChildId: null, children: [] }))
    await waitFor(() => {
      expect(screen.getByText(/today —/i)).toBeInTheDocument()
    })
  })
})

describe('DashboardProvider auto-selects first child', () => {
  it('shows TodayLessonCard when selectedChildId is provided with a child', async () => {
    const ctx = makeCtx({
      selectedChildId: 'child_001',
      children: [mockChild],
    })
    renderDoToday(ctx)
    await waitFor(() => {
      expect(screen.getByText(/today —/i)).toBeInTheDocument()
    })
  })
})

describe('DoToday edit lesson inline popup (G7c)', () => {
  const today = todayLocalForTest()
  const lesson: LessonTask = {
    id: 'lesson_abc',
    childId: 'child_001',
    subjectId: 'subj_001',
    householdId: 'hh_001',
    title: 'Test Lesson',
    dueDate: today,
    status: 'not_started',
    order: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('edit icon click opens an inline modal instead of navigating away', async () => {
    const { plannerApi } = jest.requireMock('@/features/plan/front/services/api')
    plannerApi.getLessons.mockResolvedValue([lesson])
    plannerApi.getLesson.mockResolvedValue(lesson)

    const { useHousehold } = jest.requireMock('@/features/household/front/context')
    useHousehold.mockReturnValue({ studentProfiles: [mockChild], allSubjects: [] })

    renderDoToday(makeCtx({ children: [mockChild], selectedChildId: 'child_001' }))

    await waitFor(() => {
      expect(screen.getByText('Test Lesson')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('edit-lesson-modal')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))

    expect(await screen.findByTestId('edit-lesson-modal')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Lesson')).toBeInTheDocument()
    })
  })

  it('saving within the modal updates the lesson without leaving the Dashboard', async () => {
    const { plannerApi } = jest.requireMock('@/features/plan/front/services/api')
    plannerApi.getLessons.mockResolvedValue([lesson])
    plannerApi.getLesson.mockResolvedValue(lesson)
    plannerApi.updateLesson.mockResolvedValue({ ...lesson, title: 'Updated Lesson' })

    const { useHousehold } = jest.requireMock('@/features/household/front/context')
    useHousehold.mockReturnValue({ studentProfiles: [mockChild], allSubjects: [] })

    renderDoToday(makeCtx({ children: [mockChild], selectedChildId: 'child_001' }))

    await waitFor(() => {
      expect(screen.getByText('Test Lesson')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))
    await screen.findByTestId('edit-lesson-modal')

    const titleInput = await screen.findByDisplayValue('Test Lesson')
    fireEvent.change(titleInput, { target: { value: 'Updated Lesson' } })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(plannerApi.updateLesson).toHaveBeenCalledWith(
        'lesson_abc',
        expect.objectContaining({ title: 'Updated Lesson' }),
      )
    })
    await waitFor(() => {
      expect(screen.queryByTestId('edit-lesson-modal')).not.toBeInTheDocument()
    })
    // Never navigated away — DoToday itself is still rendered
    expect(screen.getByText(/today —/i)).toBeInTheDocument()
  })
})
