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

function renderGrid(lessons: LessonTask[] = [], weekStartDay: 'Monday' | 'Sunday' = 'Monday') {
  const mockContext = {
    lessons,
    selectedWeek: new Date('2026-05-12'),
    setSelectedWeek: jest.fn(),
    selectedChildIds: ['child_001'],
    setSelectedChildIds: jest.fn(),
    selectedSubjectIds: ['subj_001'],
    setSelectedSubjectIds: jest.fn(),
    isLoading: false,
    error: null,
    weekStartDay,
    children: mockChildren,
    subjects: mockSubjects,
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
