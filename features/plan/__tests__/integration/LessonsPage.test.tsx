import React from 'react'
import { render, screen, waitFor, act, fireEvent, within } from '@testing-library/react'
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
    getLesson: jest.fn(),
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
const mockGetLesson = plannerApi.getLesson as jest.Mock
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

  // ─── Phase 4: "Overdue" status filter (item 25) ───────────────────────────

  it('status filter dropdown includes an Overdue option', async () => {
    mockGetLessons.mockResolvedValue([])
    render(<LessonsPage />)
    await waitFor(() => expect(screen.getByText(/all lessons/i)).toBeInTheDocument())
    expect(screen.getByRole('option', { name: 'Overdue' })).toBeInTheDocument()
  })

  it('Overdue filter shows a past-due not_started lesson but not a completed one due the same day', async () => {
    const overdueLesson = makeLesson({ id: 'lesson_overdue', title: 'Overdue Lesson', status: 'not_started', dueDate: '2020-01-01' })
    const completedPastLesson = makeLesson({ id: 'lesson_done', title: 'Completed Past Lesson', status: 'completed', dueDate: '2020-01-01' })
    const futureLesson = makeLesson({ id: 'lesson_future', title: 'Future Lesson', status: 'not_started', dueDate: '2099-12-31' })
    mockGetLessons.mockResolvedValue([overdueLesson, completedPastLesson, futureLesson])

    render(<LessonsPage />)
    await waitFor(() => expect(screen.getByText('Overdue Lesson')).toBeInTheDocument())

    const statusSelect = screen.getByRole('option', { name: 'Overdue' }).closest('select')!
    fireEvent.change(statusSelect, { target: { value: 'overdue' } })

    await waitFor(() => {
      expect(screen.getByText('Overdue Lesson')).toBeInTheDocument()
      expect(screen.queryByText('Completed Past Lesson')).not.toBeInTheDocument()
      expect(screen.queryByText('Future Lesson')).not.toBeInTheDocument()
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

// ─── UAT 4.5 (Oct 10): pick several learners; don't load every lesson ever created ───

describe('LessonsPage — learner and date-range filters', () => {
  const child002: StudentProfile = { id: 'child_002', householdId: 'hh_001', name: 'Khadijah', gradeLabel: '3rd', isActive: true, username: 'k', password: 'pw', createdAt: '2026-01-01T00:00:00Z' }
  const child003: StudentProfile = { id: 'child_003', householdId: 'hh_001', name: 'Yusuf', gradeLabel: '1st', isActive: true, username: 'y', password: 'pw', createdAt: '2026-01-01T00:00:00Z' }

  function localDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  function thisMonday(): string {
    const d = new Date()
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1))
    return localDate(d)
  }

  beforeEach(() => {
    mockUseHousehold.mockImplementation(() => ({
      householdProfile: { id: 'hh_001' },
      studentProfiles: [mockChildren[0], child002, child003],
      allSubjects: mockSubjects,
      loading: false,
      needsSetup: false,
      familyName: '',
      error: null,
      refetch: jest.fn(),
    }))
  })

  function learnerChips() {
    return within(screen.getByRole('group', { name: /filter by learner/i }))
  }

  it('loads only this week onward for all learners by default', async () => {
    render(<LessonsPage />)
    await waitFor(() => expect(mockGetLessons).toHaveBeenCalled())
    expect(mockGetLessons).toHaveBeenLastCalledWith(undefined, undefined, undefined, thisMonday())
    expect(screen.getByRole('combobox', { name: /date range/i })).toHaveValue('week')
    expect(learnerChips().getByRole('button', { name: 'All children' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('selects several learners and asks the server for just those', async () => {
    render(<LessonsPage />)
    await waitFor(() => expect(mockGetLessons).toHaveBeenCalled())

    fireEvent.click(learnerChips().getByRole('button', { name: 'Adam' }))
    fireEvent.click(learnerChips().getByRole('button', { name: 'Yusuf' }))

    await waitFor(() => {
      expect(mockGetLessons).toHaveBeenLastCalledWith(undefined, ['child_001', 'child_003'], undefined, thisMonday())
    })
    expect(learnerChips().getByRole('button', { name: 'Adam' })).toHaveAttribute('aria-pressed', 'true')
    expect(learnerChips().getByRole('button', { name: 'Khadijah' })).toHaveAttribute('aria-pressed', 'false')
    expect(learnerChips().getByRole('button', { name: 'Yusuf' })).toHaveAttribute('aria-pressed', 'true')
    expect(learnerChips().getByRole('button', { name: 'All children' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows only the selected learners\' lessons', async () => {
    mockGetLessons.mockImplementation(async (_w: unknown, childIds?: string[]) => {
      const all = [
        makeLesson({ id: 'a', title: 'Adam fractions', childId: 'child_001', dueDate: '2099-01-01' }),
        makeLesson({ id: 'k', title: 'Khadijah reading', childId: 'child_002', dueDate: '2099-01-01' }),
        makeLesson({ id: 'y', title: 'Yusuf phonics', childId: 'child_003', dueDate: '2099-01-01' }),
      ]
      return childIds ? all.filter(l => childIds.includes(l.childId)) : all
    })
    render(<LessonsPage />)
    await waitFor(() => expect(screen.getByText('Khadijah reading')).toBeInTheDocument())

    fireEvent.click(learnerChips().getByRole('button', { name: 'Adam' }))
    fireEvent.click(learnerChips().getByRole('button', { name: 'Yusuf' }))

    await waitFor(() => expect(screen.queryByText('Khadijah reading')).not.toBeInTheDocument())
    expect(screen.getByText('Adam fractions')).toBeInTheDocument()
    expect(screen.getByText('Yusuf phonics')).toBeInTheDocument()
  })

  it('clicking a selected learner again, or All children, clears the selection', async () => {
    render(<LessonsPage />)
    await waitFor(() => expect(mockGetLessons).toHaveBeenCalled())

    fireEvent.click(learnerChips().getByRole('button', { name: 'Adam' }))
    fireEvent.click(learnerChips().getByRole('button', { name: 'Yusuf' }))
    fireEvent.click(learnerChips().getByRole('button', { name: 'Yusuf' }))
    await waitFor(() => {
      expect(mockGetLessons).toHaveBeenLastCalledWith(undefined, ['child_001'], undefined, thisMonday())
    })

    fireEvent.click(learnerChips().getByRole('button', { name: 'All children' }))
    await waitFor(() => {
      expect(mockGetLessons).toHaveBeenLastCalledWith(undefined, undefined, undefined, thisMonday())
    })
  })

  it('starts with the header learner selected', async () => {
    mockUseLearner.mockImplementation(() => ({ selectedChildId: 'child_002', setSelectedChildId: jest.fn() }))
    render(<LessonsPage />)
    await waitFor(() => {
      expect(mockGetLessons).toHaveBeenLastCalledWith(undefined, ['child_002'], undefined, thisMonday())
    })
    expect(learnerChips().getByRole('button', { name: 'Khadijah' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('follows the header learner when it changes while the page stays mounted', async () => {
    const { rerender } = render(<LessonsPage />)
    await waitFor(() => {
      expect(learnerChips().getByRole('button', { name: 'All children' })).toHaveAttribute('aria-pressed', 'true')
    })

    act(() => { mockUseLearner.mockImplementation(() => ({ selectedChildId: 'child_002', setSelectedChildId: jest.fn() })) })
    rerender(<LessonsPage />)

    await waitFor(() => {
      expect(learnerChips().getByRole('button', { name: 'Khadijah' })).toHaveAttribute('aria-pressed', 'true')
    })
    expect(mockGetLessons).toHaveBeenLastCalledWith(undefined, ['child_002'], undefined, thisMonday())
  })

  it('"All dates" drops the start date; "Past 30 days" starts 30 days back', async () => {
    render(<LessonsPage />)
    await waitFor(() => expect(mockGetLessons).toHaveBeenCalled())
    const range = screen.getByRole('combobox', { name: /date range/i })

    fireEvent.change(range, { target: { value: 'all' } })
    await waitFor(() => {
      expect(mockGetLessons).toHaveBeenLastCalledWith(undefined, undefined, undefined, undefined)
    })

    fireEvent.change(range, { target: { value: 'month' } })
    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 30)
    await waitFor(() => {
      expect(mockGetLessons).toHaveBeenLastCalledWith(undefined, undefined, undefined, localDate(monthAgo))
    })
  })

  it('Overdue looks across every date and says so, so old overdue lessons are not hidden', async () => {
    render(<LessonsPage />)
    await waitFor(() => expect(mockGetLessons).toHaveBeenCalled())

    const statusSelect = screen.getByRole('option', { name: 'Overdue' }).closest('select')!
    fireEvent.change(statusSelect, { target: { value: 'overdue' } })

    await waitFor(() => {
      expect(mockGetLessons).toHaveBeenLastCalledWith(undefined, undefined, undefined, undefined)
    })
    expect(screen.getByRole('combobox', { name: /date range/i })).toBeDisabled()
    expect(screen.getByText(/overdue shows every date/i)).toBeInTheDocument()
  })

  it('a deep link to an older lesson widens the range and selects that lesson\'s learner', async () => {
    const old = makeLesson({ id: 'lesson_old', title: 'Old shared lesson', childId: 'child_003', dueDate: '2020-01-06' })
    mockSearchParams = new URLSearchParams('editId=lesson_old')
    mockGetLesson.mockResolvedValue(old)
    mockGetLessons.mockImplementation(async (_w: unknown, _c: unknown, _s: unknown, startDate?: string) =>
      (!startDate || old.dueDate >= startDate ? [old] : []))

    render(<LessonsPage />)

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /date range/i })).toHaveValue('all')
    })
    expect(learnerChips().getByRole('button', { name: 'Yusuf' })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => {
      expect(document.querySelector('[data-lesson-id="lesson_old"]')).not.toBeNull()
    })
    expect(screen.getByDisplayValue('Old shared lesson')).toBeInTheDocument()
  })

  it('says no lessons match when the filters leave nothing', async () => {
    mockGetLessons.mockResolvedValue([])
    render(<LessonsPage />)
    await waitFor(() => expect(screen.getByText(/no lessons match these filters/i)).toBeInTheDocument())
  })

  it('shows the load error when the lessons request fails', async () => {
    mockGetLessons.mockRejectedValue(new Error('boom'))
    render(<LessonsPage />)
    await waitFor(() => expect(screen.getByText(/could not load lessons/i)).toBeInTheDocument())
  })
})

// Reproduced on dev 2026-10-12: Calendar/Planner pencil → /lessons?editId= → Save, and the
// editor opened again (the list unmounted while refetching and the card remounted in edit
// mode); editId also stayed in the URL, so a reload reopened it.
describe('LessonsPage — deep-linked editor closes for good', () => {
  const lesson = makeLesson({ id: 'lesson_deep', title: 'Deep linked', dueDate: '2099-01-05' })

  beforeEach(() => {
    mockSearchParams = new URLSearchParams('editId=lesson_deep')
    mockGetLesson.mockResolvedValue(lesson)
    mockGetLessons.mockResolvedValue([lesson])
    ;(plannerApi.updateLesson as jest.Mock).mockResolvedValue({ ...lesson, title: 'Renamed' })
  })

  function editor() { return document.querySelector('[data-lesson-id="lesson_deep"]') as HTMLElement }

  it('Save closes the editor, it stays closed after the list refreshes, and editId leaves the URL', async () => {
    render(<LessonsPage />)
    await waitFor(() => expect(within(editor()).getByRole('button', { name: /save lesson/i })).toBeInTheDocument())
    mockGetLessons.mockResolvedValue([{ ...lesson, title: 'Renamed' }])

    fireEvent.change(within(editor()).getByDisplayValue('Deep linked'), { target: { value: 'Renamed' } })
    fireEvent.click(within(editor()).getByRole('button', { name: /save lesson/i }))

    await waitFor(() => expect(screen.getByText('Renamed')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /save lesson/i })).not.toBeInTheDocument()
    expect(mockReplace).toHaveBeenCalledWith('/lessons')
  })

  it('Cancel closes the editor and clears editId', async () => {
    render(<LessonsPage />)
    await waitFor(() => expect(within(editor()).getByRole('button', { name: /cancel edit/i })).toBeInTheDocument())
    fireEvent.click(within(editor()).getByRole('button', { name: /cancel edit/i }))
    expect(screen.queryByRole('button', { name: /save lesson/i })).not.toBeInTheDocument()
    expect(mockReplace).toHaveBeenCalledWith('/lessons')
  })

  it('keeps other query params when clearing editId', async () => {
    mockSearchParams = new URLSearchParams('editId=lesson_deep&add=1')
    render(<LessonsPage />)
    await waitFor(() => expect(within(editor()).getByRole('button', { name: /cancel edit/i })).toBeInTheDocument())
    fireEvent.click(within(editor()).getByRole('button', { name: /cancel edit/i }))
    expect(mockReplace).toHaveBeenCalledWith('/lessons?add=1')
  })

  it('keeps showing the list (no "Loading…") while it refreshes after a save', async () => {
    let resolveRefetch: (v: LessonTask[]) => void = () => {}
    render(<LessonsPage />)
    await waitFor(() => expect(within(editor()).getByRole('button', { name: /save lesson/i })).toBeInTheDocument())
    mockGetLessons.mockImplementation(() => new Promise(r => { resolveRefetch = r }))

    fireEvent.click(within(editor()).getByRole('button', { name: /save lesson/i }))
    await waitFor(() => expect(mockGetLessons).toHaveBeenCalledTimes(2))
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument()
    expect(editor()).not.toBeNull()
    await act(async () => { resolveRefetch([lesson]) })
  })
})

describe('LessonsPage — delete', () => {
  const mockDeleteLesson = plannerApi.deleteLesson as jest.Mock
  const shared = makeLesson({ id: 'lesson_s', title: 'Fractions', groupId: 'group_1', dueDate: '2099-01-05' })
  const solo = makeLesson({ id: 'lesson_solo', title: 'Spelling', dueDate: '2099-01-06' })

  beforeEach(() => {
    mockGetLessons.mockResolvedValue([shared, solo])
  })

  function cardFor(id: string) { return document.querySelector(`[data-lesson-id="${id}"]`) as HTMLElement }

  it('deleting a whole shared lesson asks the server for the group, refreshes, and says how many', async () => {
    mockDeleteLesson.mockResolvedValue(5)
    render(<LessonsPage />)
    await waitFor(() => expect(cardFor('lesson_s')).not.toBeNull())
    mockGetLessons.mockResolvedValue([solo])

    fireEvent.click(within(cardFor('lesson_s')).getByRole('button', { name: /delete lesson/i }))
    fireEvent.click(screen.getByRole('button', { name: 'All learners in this group' }))

    await waitFor(() => expect(mockDeleteLesson).toHaveBeenCalledWith('lesson_s', { deleteGroup: true }))
    expect(await screen.findByText('“Fractions” deleted for 5 learners')).toBeInTheDocument()
    await waitFor(() => expect(cardFor('lesson_s')).toBeNull())
  })

  it("deleting one learner's copy names that learner", async () => {
    mockDeleteLesson.mockResolvedValue(1)
    render(<LessonsPage />)
    await waitFor(() => expect(cardFor('lesson_s')).not.toBeNull())
    fireEvent.click(within(cardFor('lesson_s')).getByRole('button', { name: /delete lesson/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Just Adam' }))
    await waitFor(() => expect(mockDeleteLesson).toHaveBeenCalledWith('lesson_s', { deleteGroup: false }))
    expect(await screen.findByText('“Fractions” deleted for Adam')).toBeInTheDocument()
  })

  it('a lesson for one learner is deleted with a plain confirmation', async () => {
    mockDeleteLesson.mockResolvedValue(1)
    render(<LessonsPage />)
    await waitFor(() => expect(cardFor('lesson_solo')).not.toBeNull())
    fireEvent.click(within(cardFor('lesson_solo')).getByRole('button', { name: /delete lesson/i }))
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(mockDeleteLesson).toHaveBeenCalledWith('lesson_solo', { deleteGroup: false }))
    expect(await screen.findByText('“Spelling” deleted')).toBeInTheDocument()
  })

  it('a failed delete keeps the lesson and shows the reason', async () => {
    mockDeleteLesson.mockRejectedValue(new Error('Lesson not found'))
    render(<LessonsPage />)
    await waitFor(() => expect(cardFor('lesson_solo')).not.toBeNull())
    fireEvent.click(within(cardFor('lesson_solo')).getByRole('button', { name: /delete lesson/i }))
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Lesson not found')
    expect(screen.getByText('Spelling')).toBeInTheDocument()
  })
})
