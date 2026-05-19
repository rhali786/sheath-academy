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
