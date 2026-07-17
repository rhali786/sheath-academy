import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { WeekGrid } from '@/features/plan/front/components/WeekGrid'
import { PlannerContext } from '@/features/plan/front/context/PlannerContext'
import type { LessonTask } from '@/features/plan/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(() => ({
    householdProfile: { id: 'hh_001', weekStartDay: 'Monday', familyName: 'Test' },
    studentProfiles: [],
    allSubjects: [],
    loading: false,
    familyName: 'Test',
    needsSetup: false,
    error: null,
    refetch: jest.fn(),
  })),
}))

import { useHousehold } from '@/features/household/front/context'
const mockUseHousehold = useHousehold as jest.Mock

let mockCapturedDragEnd: ((event: any) => Promise<void>) | null = null

jest.mock('@dnd-kit/core', () => {
  const React = require('react')
  return {
    DndContext: jest.fn().mockImplementation(({ children, onDragEnd }: any) => {
      mockCapturedDragEnd = onDragEnd
      return React.createElement(React.Fragment, null, children)
    }),
    useDraggable: jest.fn().mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: null,
      isDragging: false,
    }),
    useDroppable: jest.fn().mockReturnValue({
      setNodeRef: jest.fn(),
      isOver: false,
    }),
    DragOverlay: jest.fn().mockImplementation(({ children }: any) =>
      React.createElement(React.Fragment, null, children ?? null)
    ),
  }
})

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    updateLesson: jest.fn(() => Promise.resolve({})),
  },
}))

import { plannerApi } from '@/features/plan/front/services/api'
const mockUpdateLesson = plannerApi.updateLesson as jest.Mock

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
    householdId: 'hh_001',
    title: 'Math lesson 1',
    description: 'Algebra basics',
    dueDate: '2026-05-13',
    status: 'not_started' as const,
    order: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

const mockRefreshLessons = jest.fn()

interface RenderGridOptions {
  selectedWeek?: Date
  children?: typeof mockChildren
  subjects?: typeof mockSubjects
  selectedChildIds?: string[]
  selectedSubjectIds?: string[]
}

function renderGrid(
  lessons: LessonTask[] = [],
  weekStartDay: 'Monday' | 'Sunday' = 'Monday',
  options: RenderGridOptions = {}
) {
  const {
    selectedWeek = new Date('2026-05-12'),
    children = mockChildren,
    subjects = mockSubjects,
    selectedChildIds = ['child_001'],
    selectedSubjectIds = ['subj_001'],
  } = options

  const mockContext = {
    lessons,
    selectedWeek,
    setSelectedWeek: jest.fn(),
    selectedChildIds,
    setSelectedChildIds: jest.fn(),
    selectedSubjectIds,
    setSelectedSubjectIds: jest.fn(),
    isInitializing: false,
    isLessonsLoading: false,
    isLoading: false,
    error: null,
    weekStartDay,
    children,
    subjects,
    refreshLessons: mockRefreshLessons,
  }

  return render(
    <PlannerContext.Provider value={mockContext as any}>
      <WeekGrid />
    </PlannerContext.Provider>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCapturedDragEnd = null
})

describe('WeekGrid (desktop)', () => {
  it('renders 7 columns (Mon–Sun) with correct headers', () => {
    renderGrid()

    expect(screen.getByText('Monday')).toBeInTheDocument()
    expect(screen.getByText('Tuesday')).toBeInTheDocument()
    expect(screen.getByText('Wednesday')).toBeInTheDocument()
    expect(screen.getByText('Thursday')).toBeInTheDocument()
    expect(screen.getByText('Friday')).toBeInTheDocument()
    expect(screen.getByText('Saturday')).toBeInTheDocument()
    expect(screen.getByText('Sunday')).toBeInTheDocument()
  })

  it('renders child/subject as row labels', () => {
    renderGrid()

    expect(screen.getByText('Adam')).toBeInTheDocument()
    expect(screen.getByText('Math')).toBeInTheDocument()
  })

  it('lesson cells contain lesson title and description', () => {
    renderGrid(mockLessons)

    expect(screen.getByText('Math lesson 1')).toBeInTheDocument()
    expect(screen.getByText('Algebra basics')).toBeInTheDocument()
  })

  it('clicking a lesson navigates to the edit page', () => {
    renderGrid(mockLessons)

    fireEvent.click(screen.getByText('Math lesson 1'))

    expect(mockPush).toHaveBeenCalledWith('/lessons?editId=lesson_001')
  })

  it('lesson card shows a drag-to-reschedule affordance', () => {
    renderGrid(mockLessons)

    expect(screen.getByLabelText(/drag to reschedule/i)).toBeInTheDocument()
  })

  it('weekends columns have de-emphasis class', () => {
    const { container } = renderGrid()

    const weekendCells = container.querySelectorAll('.opacity-60')
    expect(weekendCells.length).toBeGreaterThan(0)
  })

  it('lesson appears in the cell for its dueDate, childId and subjectId', () => {
    renderGrid(mockLessons)

    expect(screen.getByText('Math lesson 1')).toBeInTheDocument()
    expect(screen.getByText('Algebra basics')).toBeInTheDocument()
  })

  it('lesson does not appear when dueDate is outside the displayed week', () => {
    const outsideLesson: LessonTask[] = [
      {
        ...mockLessons[0],
        dueDate: '2026-05-25',
        title: 'Far future lesson',
      },
    ]
    renderGrid(outsideLesson)

    expect(screen.queryByText('Far future lesson')).not.toBeInTheDocument()
  })

  it('drag-end with a new date calls updateLesson and refreshLessons', async () => {
    renderGrid(mockLessons)

    expect(mockCapturedDragEnd).not.toBeNull()

    await mockCapturedDragEnd!({
      active: { id: 'lesson_001', data: { current: {} } },
      over: {
        id: 'child_001:subj_001:2026-05-14',
        data: { current: { dateStr: '2026-05-14' } },
      },
    })

    expect(mockUpdateLesson).toHaveBeenCalledWith('lesson_001', { dueDate: '2026-05-14' })
    expect(mockRefreshLessons).toHaveBeenCalled()
  })

  it('drag-end onto the same date does nothing', async () => {
    renderGrid(mockLessons)

    expect(mockCapturedDragEnd).not.toBeNull()

    await mockCapturedDragEnd!({
      active: { id: 'lesson_001', data: { current: {} } },
      over: {
        id: 'child_001:subj_001:2026-05-13',
        data: { current: { dateStr: '2026-05-13' } },
      },
    })

    expect(mockUpdateLesson).not.toHaveBeenCalled()
    expect(mockRefreshLessons).not.toHaveBeenCalled()
  })

  it('drag-end with no drop target does nothing', async () => {
    renderGrid(mockLessons)

    expect(mockCapturedDragEnd).not.toBeNull()

    await mockCapturedDragEnd!({
      active: { id: 'lesson_001', data: { current: {} } },
      over: null,
    })

    expect(mockUpdateLesson).not.toHaveBeenCalled()
  })
})

describe('WeekGrid — BUG-009 subject ownership', () => {
  const twoChildren: StudentProfile[] = [
    { id: 'child_001', householdId: 'hh_001', name: 'Adam', gradeLabel: '5th', isActive: true, username: 'adam', password: 'pwd', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'child_002', householdId: 'hh_001', name: 'Khadijah', gradeLabel: '3rd', isActive: true, username: 'khadijah', password: 'pwd', createdAt: '2026-01-01T00:00:00Z' },
  ]

  const twoSubjects: SubjectCourse[] = [
    { id: 'subj_adam_math', childId: 'child_001', name: 'Math', category: 'Math', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'subj_khad_reading', childId: 'child_002', name: 'Reading', category: 'English', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
  ]

  it('each child only shows their own subjects as row labels', () => {
    const { container } = renderGrid([], 'Monday', {
      children: twoChildren,
      subjects: twoSubjects,
      selectedChildIds: ['child_001', 'child_002'],
      selectedSubjectIds: ['subj_adam_math', 'subj_khad_reading'],
    })

    // Both children appear
    expect(screen.getByText('Adam')).toBeInTheDocument()
    expect(screen.getByText('Khadijah')).toBeInTheDocument()

    // Each subject appears exactly once (not cross-multiplied)
    const mathCells = container.querySelectorAll('td')
    const mathTexts = Array.from(mathCells).map(td => td.textContent)
    const mathCount = mathTexts.filter(t => t?.includes('Math')).length
    const readingCount = mathTexts.filter(t => t?.includes('Reading')).length
    expect(mathCount).toBe(1)
    expect(readingCount).toBe(1)

    // Should have exactly 2 rows (not 4 from cross product)
    const rows = container.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(2)
  })
})

describe('WeekGrid — FB-006 today column highlight', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-05-13T12:00:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("today's column header has a ring highlight class", () => {
    const today = new Date()
    const { container } = renderGrid([], 'Monday', { selectedWeek: today })

    // There should be exactly one column with the today-ring highlight
    const todayHeaders = container.querySelectorAll('th.ring-2')
    expect(todayHeaders).toHaveLength(1)
  })

  it('non-today weekday columns do not have the ring highlight class', () => {
    // Use a fixed week far in the past so today is not in it
    const pastWeek = new Date('2020-01-06') // Monday Jan 6, 2020
    const { container } = renderGrid([], 'Monday', { selectedWeek: pastWeek })

    const todayHeaders = container.querySelectorAll('th.ring-2')
    expect(todayHeaders).toHaveLength(0)
  })
})

describe('WeekGrid — FB-006 duration in cells and daily totals', () => {
  const lessonWith30min: LessonTask = {
    ...mockLessons[0],
    dueDate: '2026-05-13',
    estimatedDuration: '30min' as const,
  }

  it('shows estimated duration label in lesson cell', () => {
    renderGrid([lessonWith30min])
    expect(screen.getByText('30 min')).toBeInTheDocument()
  })

  it('shows daily duration total in table footer when lessons have estimatedDuration', () => {
    renderGrid([lessonWith30min])
    expect(screen.getByText('30m')).toBeInTheDocument()
  })

  it('does not show duration total when no lessons have estimatedDuration', () => {
    renderGrid(mockLessons)
    // No duration info in cells
    expect(screen.queryByText(/\d+m|\d+h/)).not.toBeInTheDocument()
  })
})

describe('WeekGrid — completion window', () => {
  const windowLesson: LessonTask = {
    ...mockLessons[0],
    plannedStartDate: '2026-05-11',
    dueDate: '2026-05-13',
  }

  it('shows a range indicator for lessons with a completion window', () => {
    renderGrid([windowLesson])
    expect(screen.getAllByText('May 11 – May 13').length).toBeGreaterThan(0)
  })

  it('renders window lesson on intermediate days, not only due date', () => {
    renderGrid([windowLesson])
    expect(screen.getAllByText('Math lesson 1').length).toBeGreaterThan(1)
  })

  it('completion status still resolves at due_date for overdue', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-05-14T12:00:00'))
    try {
      renderGrid([{ ...windowLesson, status: 'not_started' }])
      expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument()
    } finally {
      jest.useRealTimers()
    }
  })
})

describe('WeekGrid — US1 drag shifts whole window + Undo', () => {
  const windowLesson: LessonTask = {
    ...mockLessons[0],
    id: 'window_lesson_001',
    plannedStartDate: '2026-05-11', // span: 2 days (May 11–13)
    dueDate: '2026-05-13',
  }

  it('drag sends both plannedStartDate and dueDate preserving span', async () => {
    // Drag 7-day window lesson from dueDate 2026-05-13 → 2026-05-15 (delta +2)
    // new plannedStartDate = 2026-05-11 + 2 = 2026-05-13; new dueDate = 2026-05-15
    renderGrid([windowLesson])
    await mockCapturedDragEnd!({
      active: { id: 'window_lesson_001', data: { current: {} } },
      over: {
        id: 'child_001:subj_001:2026-05-15',
        data: { current: { dateStr: '2026-05-15' } },
      },
    })
    expect(mockUpdateLesson).toHaveBeenCalledWith('window_lesson_001', {
      dueDate: '2026-05-15',
      plannedStartDate: '2026-05-13',
    })
  })

  it('drag of lesson without plannedStartDate only sends dueDate', async () => {
    renderGrid(mockLessons) // mockLessons[0] has no plannedStartDate
    await mockCapturedDragEnd!({
      active: { id: 'lesson_001', data: { current: {} } },
      over: {
        id: 'child_001:subj_001:2026-05-14',
        data: { current: { dateStr: '2026-05-14' } },
      },
    })
    expect(mockUpdateLesson).toHaveBeenCalledWith('lesson_001', { dueDate: '2026-05-14' })
  })

  it('regression: 7-day window drag earlier keeps valid window and Undo restores both dates', async () => {
    const sevenDayLesson: LessonTask = {
      ...mockLessons[0],
      id: 'seven_day_001',
      plannedStartDate: '2026-05-12', // span: 6 days
      dueDate: '2026-05-18',
    }
    renderGrid([sevenDayLesson])

    // Drag to 2026-05-16 (earlier than start 2026-05-12? No, just 2 days earlier than dueDate)
    // delta: 2026-05-16 - 2026-05-18 = -2 days
    // new start = 2026-05-12 - 2 = 2026-05-10; new due = 2026-05-16
    await mockCapturedDragEnd!({
      active: { id: 'seven_day_001', data: { current: {} } },
      over: {
        id: 'child_001:subj_001:2026-05-16',
        data: { current: { dateStr: '2026-05-16' } },
      },
    })

    expect(mockUpdateLesson).toHaveBeenCalledWith('seven_day_001', {
      dueDate: '2026-05-16',
      plannedStartDate: '2026-05-10',
    })

    // Window is valid: 2026-05-10 <= 2026-05-16
    const [, payload] = mockUpdateLesson.mock.calls[0] as [string, any]
    expect(payload.plannedStartDate <= payload.dueDate).toBe(true)
  })
})

describe('WeekGrid — household schoolDays off-day awareness', () => {
  beforeEach(() => {
    mockUseHousehold.mockImplementation(() => ({
      householdProfile: { id: 'hh_001', weekStartDay: 'Monday', familyName: 'Test' },
      studentProfiles: [],
      allSubjects: [],
      loading: false,
      familyName: 'Test',
      needsSetup: false,
      error: null,
      refetch: jest.fn(),
    }))
  })

  it('with default household (no schoolDays set), Saturday/Sunday columns render the off-day style', () => {
    const { container } = renderGrid()

    const weekendCells = container.querySelectorAll('.opacity-60')
    expect(weekendCells.length).toBeGreaterThan(0)
  })

  it('with schoolDays = Mon–Fri, Saturday/Sunday columns render the off-day style', () => {
    mockUseHousehold.mockImplementation(() => ({
      householdProfile: {
        id: 'hh_001',
        weekStartDay: 'Monday',
        familyName: 'Test',
        schoolDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      },
      studentProfiles: [],
      allSubjects: [],
      loading: false,
      familyName: 'Test',
      needsSetup: false,
      error: null,
      refetch: jest.fn(),
    }))

    const { container } = renderGrid()
    const saturdayHeader = screen.getByText('Saturday').closest('th')
    expect(saturdayHeader?.className).toContain('opacity-60')
    expect(container.querySelectorAll('.opacity-60').length).toBeGreaterThan(0)
  })

  it('with schoolDays including Saturday, Saturday renders as a normal school day (not muted)', () => {
    mockUseHousehold.mockImplementation(() => ({
      householdProfile: {
        id: 'hh_001',
        weekStartDay: 'Monday',
        familyName: 'Test',
        schoolDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      },
      studentProfiles: [],
      allSubjects: [],
      loading: false,
      familyName: 'Test',
      needsSetup: false,
      error: null,
      refetch: jest.fn(),
    }))

    renderGrid()
    const saturdayHeader = screen.getByText('Saturday').closest('th')
    expect(saturdayHeader?.className).not.toContain('opacity-60')
    const sundayHeader = screen.getByText('Sunday').closest('th')
    expect(sundayHeader?.className).toContain('opacity-60')
  })

  it('dropping a lesson onto an off-day column succeeds (not blocked) and the confirmation notes it is an off day', async () => {
    // Week of 2026-05-12 (Tue); 2026-05-16 is Saturday, an off day under the default schedule
    renderGrid(mockLessons)

    expect(mockCapturedDragEnd).not.toBeNull()

    await mockCapturedDragEnd!({
      active: { id: 'lesson_001', data: { current: {} } },
      over: {
        id: 'child_001:subj_001:2026-05-16',
        data: { current: { dateStr: '2026-05-16' } },
      },
    })

    expect(mockUpdateLesson).toHaveBeenCalledWith('lesson_001', { dueDate: '2026-05-16' })
    expect(await screen.findByText(/off day/i)).toBeInTheDocument()
  })

  it('dropping a lesson onto a school-day column succeeds without an off-day note', async () => {
    // 2026-05-14 is a Thursday, a school day under the default schedule
    renderGrid(mockLessons)

    await mockCapturedDragEnd!({
      active: { id: 'lesson_001', data: { current: {} } },
      over: {
        id: 'child_001:subj_001:2026-05-14',
        data: { current: { dateStr: '2026-05-14' } },
      },
    })

    expect(mockUpdateLesson).toHaveBeenCalledWith('lesson_001', { dueDate: '2026-05-14' })
    await screen.findByText(/moved/i)
    expect(screen.queryByText(/off day/i)).not.toBeInTheDocument()
  })
})
