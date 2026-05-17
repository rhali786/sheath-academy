import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
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
  },
}))

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getAllChildren: jest.fn(),
  },
}))

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: {
    getSubjects: jest.fn(),
  },
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(() => ({ householdProfile: { id: 'hh_001' } })),
}))

import { plannerApi } from '@/features/plan/front/services/api'
import { childrenApi } from '@/features/children/front/services/api'
import { subjectsApi } from '@/features/subjects/front/services/api'

const mockGetLessons = plannerApi.getLessons as jest.Mock
const mockGetAllChildren = (childrenApi as any).getAllChildren as jest.Mock
const mockGetSubjects = (subjectsApi as any).getSubjects as jest.Mock

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
  mockGetAllChildren.mockResolvedValue(ok(mockChildren))
  mockGetSubjects.mockResolvedValue(ok(mockSubjects))
  mockGetLessons.mockResolvedValue([])
  mockSearchParams = new URLSearchParams()
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('LessonsPage', () => {
  it('renders the Add lesson form heading on mount', async () => {
    render(<LessonsPage />)
    await waitFor(() => {
      // Use role to distinguish the h2 from the form submit button
      expect(screen.getByRole('heading', { name: /add lesson/i })).toBeInTheDocument()
    })
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

  it('pre-populates the form when ?editId is in the URL', async () => {
    const editLesson = makeLesson({ id: 'edit_001', title: 'Lesson To Edit' })
    mockGetLessons.mockResolvedValue([editLesson])
    mockSearchParams = new URLSearchParams('editId=edit_001')

    render(<LessonsPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /edit lesson/i })).toBeInTheDocument()
    })

    expect(mockReplace).toHaveBeenCalledWith('/lessons', { scroll: false })
  })

  it('sets child filter from ?childId query param after children load', async () => {
    const laythLesson  = makeLesson({ id: 'l1', title: 'Layth lesson',  childId: 'child_001' })
    const khadijahLesson = makeLesson({ id: 'l2', title: 'Khadijah lesson', childId: 'child_002' })
    mockGetAllChildren.mockResolvedValue(ok([
      mockChildren[0],
      { id: 'child_002', householdId: 'hh_001', name: 'Khadijah', gradeLabel: '3rd', isActive: true, username: 'k', password: 'pw', createdAt: '2026-01-01T00:00:00Z' },
    ]))
    mockGetLessons.mockResolvedValue([laythLesson, khadijahLesson])
    mockSearchParams = new URLSearchParams('childId=child_002')

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

  it('updates child filter when URL childId changes while component stays mounted', async () => {
    const child002 = { id: 'child_002', householdId: 'hh_001', name: 'Khadijah', gradeLabel: '3rd', isActive: true, username: 'k', password: 'pw', createdAt: '2026-01-01T00:00:00Z' }
    mockGetAllChildren.mockResolvedValue(ok([mockChildren[0], child002]))
    mockSearchParams = new URLSearchParams()

    const { rerender } = render(<LessonsPage />)

    // Wait for children to load — filter starts empty (All children)
    await waitFor(() => {
      const sel = screen.getAllByRole('combobox').find(s =>
        Array.from((s as HTMLSelectElement).options ?? []).some(o => o.text === 'All children')
      ) as HTMLSelectElement
      expect(sel).toHaveValue('')
    })

    // Simulate URL change while component stays mounted
    act(() => { mockSearchParams = new URLSearchParams('childId=child_002') })
    rerender(<LessonsPage />)

    await waitFor(() => {
      const sel = screen.getAllByRole('combobox').find(s =>
        Array.from((s as HTMLSelectElement).options ?? []).some(o => o.text === 'All children')
      ) as HTMLSelectElement
      expect(sel).toHaveValue('child_002')
    })
  })
})
