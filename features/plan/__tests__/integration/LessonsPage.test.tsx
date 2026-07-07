import React from 'react'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { LessonsPage } from '@/features/plan/front/pages/LessonsPage'

const mockReplace = jest.fn()
let mockSearchParams = new URLSearchParams()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}))
import type { LessonTask } from '@/features/plan/types'
import type { StudentProfile, ApiResponse } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    getLessons: jest.fn(),
    createLesson: jest.fn(),
    updateLesson: jest.fn(),
    deleteLesson: jest.fn(),
    completeLesson: jest.fn(),
  },
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

jest.mock('@/features/layout/front/context/LearnerContext', () => ({
  useLearner: jest.fn(),
}))

import { plannerApi } from '@/features/plan/front/services/api'
import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'

const mockGetLessons = plannerApi.getLessons as jest.Mock
const mockCompleteLesson = plannerApi.completeLesson as jest.Mock
const mockUseHousehold = useHousehold as jest.Mock
const mockUseLearner = useLearner as jest.Mock

const mockChildren: StudentProfile[] = [
  { id: 'child_001', householdId: 'hh_001', name: 'Adam', gradeLabel: '5th', isActive: true, username: 'adam', password: 'pw', createdAt: '2026-01-01T00:00:00Z' },
]

const mockSubjects: SubjectCourse[] = [
  { id: 'subj_001', childId: 'child_001', name: 'Math', category: 'Math', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
]

function makeLesson(overrides: Partial<LessonTask> = {}): LessonTask {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return {
    id: 'lesson_001',
    childId: 'child_001',
    subjectId: 'subj_001',
    householdId: 'hh_001',
    title: 'Test Lesson',
    dueDate: todayStr,
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function ok<T>(data: T): ApiResponse<T> {
  return { status: 'success', data, message: '', timestamp: '' }
}

beforeEach(() => {
  mockUseHousehold.mockImplementation(() => ({
    householdProfile: { id: 'hh_001' },
    studentProfiles: mockChildren,
    allSubjects: mockSubjects,
    loading: false,
    needsSetup: false,
    familyName: '',
    error: null,
    refetch: jest.fn(),
  }))
  mockUseLearner.mockImplementation(() => ({
    selectedChildId: null,
    setSelectedChildId: jest.fn(),
  }))
  mockGetLessons.mockResolvedValue([])
  mockCompleteLesson.mockResolvedValue(undefined)
  mockSearchParams = new URLSearchParams()
})

afterEach(() => {
  jest.clearAllMocks()
})

async function openAddLessonForm() {
  fireEvent.click(screen.getByRole('button', { name: /add lesson/i }))
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /add lesson/i })).toBeInTheDocument()
  })
}

describe('LessonsPage', () => {
  it('renders the Add lesson form heading when the form is expanded', async () => {
    render(<LessonsPage />)
    await openAddLessonForm()
  })

  it('renders Today section when children have loaded', async () => {
    render(<LessonsPage />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^today$/i })).toBeInTheDocument()
    })
  })

  it('Today section shows only lessons for today matching the first child', async () => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const todayLesson = makeLesson({ id: 'l1', title: 'Todays Adam Lesson', childId: 'child_001', dueDate: todayStr })
    const otherDayLesson = makeLesson({ id: 'l2', title: 'Other Day Lesson', childId: 'child_001', dueDate: '2026-01-01' })
    const otherChildLesson = makeLesson({ id: 'l3', title: 'Other Child Lesson', childId: 'child_002', dueDate: todayStr })

    mockGetLessons.mockResolvedValue([todayLesson, otherDayLesson, otherChildLesson])

    const { container } = render(<LessonsPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^today$/i })).toBeInTheDocument()
    })

    // Find the Today section specifically (sibling of the Today heading)
    const todayHeading = screen.getByRole('heading', { name: /^today$/i })
    const todaySection = todayHeading.closest('div')!

    // TodayLessonCard within Today section should show only today's lesson for child_001
    expect(todaySection.textContent).toContain('Todays Adam Lesson')
    expect(todaySection.textContent).not.toContain('Other Child Lesson')
    // "Other Day Lesson" has dueDate 2026-01-01, so it won't appear in Today section
    expect(todaySection.textContent).not.toContain('Other Day Lesson')
  })

  it('Today section does not trigger an independent getLessons call', async () => {
    render(<LessonsPage />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^today$/i })).toBeInTheDocument()
    })
    // Only the LessonsPage-level fetch should call getLessons (not TodayLessonCard independently)
    // With externalLessons prop, TodayLessonCard skips its own fetch
    expect(mockGetLessons).toHaveBeenCalledTimes(1)
  })

  it('renders All lessons section heading', async () => {
    render(<LessonsPage />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /all lessons/i })).toBeInTheDocument()
    })
  })

  it('shows the Add lesson form heading when expanded (inline edit is per-card, not top form)', async () => {
    const editLesson = makeLesson({ id: 'edit_001', title: 'Lesson To Edit' })
    mockGetLessons.mockResolvedValue([editLesson])

    render(<LessonsPage />)
    await openAddLessonForm()
    expect(screen.queryByRole('heading', { name: /edit lesson/i })).not.toBeInTheDocument()
  })

  it('sets child filter from the header learner selection after children load', async () => {
    const child002 = { id: 'child_002', householdId: 'hh_001', name: 'Khadijah', gradeLabel: '3rd', isActive: true, username: 'k', password: 'pw', createdAt: '2026-01-01T00:00:00Z' }
    mockUseHousehold.mockImplementation(() => ({
      householdProfile: { id: 'hh_001' },
      studentProfiles: [mockChildren[0], child002],
      allSubjects: mockSubjects,
      loading: false,
      needsSetup: false,
      familyName: '',
      error: null,
      refetch: jest.fn(),
    }))
    const laythLesson  = makeLesson({ id: 'l1', title: 'Layth lesson',  childId: 'child_001' })
    const khadijahLesson = makeLesson({ id: 'l2', title: 'Khadijah lesson', childId: 'child_002' })
    mockGetLessons.mockResolvedValue([laythLesson, khadijahLesson])
    mockUseLearner.mockImplementation(() => ({ selectedChildId: 'child_002', setSelectedChildId: jest.fn() }))

    render(<LessonsPage />)

    await waitFor(() => {
      // Find the "All lessons" child filter by the "All children" option
      const allChildrenSelect = screen.getAllByRole('combobox').find(s =>
        Array.from((s as HTMLSelectElement).options || []).some(o => o.text === 'All children')
      ) as HTMLSelectElement
      expect(allChildrenSelect).toHaveValue('child_002')
    })
  })

  it('falls back to All Children filter when ?childId is invalid', async () => {
    mockSearchParams = new URLSearchParams('childId=nonexistent_child')

    render(<LessonsPage />)

    await waitFor(() => {
      const allChildrenSelect = screen.getAllByRole('combobox').find(s =>
        Array.from((s as HTMLSelectElement).options || []).some(o => o.text === 'All children')
      ) as HTMLSelectElement
      expect(allChildrenSelect).toHaveValue('')
    })
  })

  it('updates child filter when the header learner changes while component stays mounted', async () => {
    const child002 = { id: 'child_002', householdId: 'hh_001', name: 'Khadijah', gradeLabel: '3rd', isActive: true, username: 'k', password: 'pw', createdAt: '2026-01-01T00:00:00Z' }
    mockUseHousehold.mockImplementation(() => ({
      householdProfile: { id: 'hh_001' },
      studentProfiles: [mockChildren[0], child002],
      allSubjects: mockSubjects,
      loading: false,
      needsSetup: false,
      familyName: '',
      error: null,
      refetch: jest.fn(),
    }))
    mockUseLearner.mockImplementation(() => ({ selectedChildId: null, setSelectedChildId: jest.fn() }))

    const { rerender } = render(<LessonsPage />)

    // Wait for children to load — filter starts empty (All children)
    await waitFor(() => {
      const sel = screen.getAllByRole('combobox').find(s =>
        Array.from((s as HTMLSelectElement).options ?? []).some(o => o.text === 'All children')
      ) as HTMLSelectElement
      expect(sel).toHaveValue('')
    })

    // Simulate the header learner switching while the component stays mounted
    act(() => { mockUseLearner.mockImplementation(() => ({ selectedChildId: 'child_002', setSelectedChildId: jest.fn() })) })
    rerender(<LessonsPage />)

    await waitFor(() => {
      const sel = screen.getAllByRole('combobox').find(s =>
        Array.from((s as HTMLSelectElement).options ?? []).some(o => o.text === 'All children')
      ) as HTMLSelectElement
      expect(sel).toHaveValue('child_002')
    })
  })

  it('handleComplete calls plannerApi.completeLesson then refetches lessons', async () => {
    const notStartedLesson = makeLesson({ id: 'lesson_001', status: 'not_started', dueDate: '2099-12-31' })
    mockGetLessons.mockResolvedValue([notStartedLesson])
    mockCompleteLesson.mockResolvedValue(undefined)

    render(<LessonsPage />)

    // Wait for lessons to load and mark-done button to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark lesson done/i })).toBeInTheDocument()
    })

    // Clear previous calls from initial load
    mockGetLessons.mockClear()
    mockGetLessons.mockResolvedValue([{ ...notStartedLesson, status: 'completed' }])

    fireEvent.click(screen.getByRole('button', { name: /mark lesson done/i }))

    await waitFor(() => {
      expect(mockCompleteLesson).toHaveBeenCalledWith('lesson_001', 'completed')
    })
    await waitFor(() => {
      expect(mockGetLessons).toHaveBeenCalled()
    })
  })

  it('collapses form and shows Lesson added confirmation after successful submit', async () => {
    const mockCreate = plannerApi.createLesson as jest.Mock
    mockCreate.mockResolvedValue(ok(makeLesson()))
    render(<LessonsPage />)
    await openAddLessonForm()

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Lesson' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /adam/i }))
    fireEvent.change(screen.getByLabelText(/course\/subject/i), { target: { value: 'subj_001' } })

    fireEvent.click(screen.getByRole('button', { name: /add lesson/i }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /add lesson/i })).not.toBeInTheDocument()
      expect(screen.getByText(/lesson added/i)).toBeInTheDocument()
    })
  })
})
