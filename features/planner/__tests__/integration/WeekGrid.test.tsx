import { render, screen } from '@testing-library/react'
import React from 'react'
import { WeekGrid } from '@/features/planner/front/components/WeekGrid'
import { PlannerContext } from '@/features/planner/front/context/PlannerContext'
import type { LessonTask } from '@/features/planner/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

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
  }

  return render(
    <PlannerContext.Provider value={mockContext}>
      <WeekGrid />
    </PlannerContext.Provider>
  )
}

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

  it('clicking a lesson cell does nothing (read-only)', () => {
    renderGrid(mockLessons)

    const lessonTitle = screen.getByText('Math lesson 1')
    const lessonCell = lessonTitle.closest('div')
    expect(lessonCell).toBeInTheDocument()
    expect(lessonCell?.getAttribute('onclick')).toBeNull()
  })

  it('weekends columns have de-emphasis class', () => {
    const { container } = renderGrid()

    const weekendCells = container.querySelectorAll('.opacity-60')
    expect(weekendCells.length).toBeGreaterThan(0)
  })

  it('lesson appears in the cell for its dueDate, childId and subjectId', () => {
    // selectedWeek is May 12 (Monday); lesson is due May 13 (Tuesday)
    renderGrid(mockLessons)

    expect(screen.getByText('Math lesson 1')).toBeInTheDocument()
    expect(screen.getByText('Algebra basics')).toBeInTheDocument()
  })

  it('lesson does not appear when dueDate is outside the displayed week', () => {
    const outsideLesson: LessonTask[] = [
      {
        ...mockLessons[0],
        dueDate: '2026-05-25', // two weeks later
        title: 'Far future lesson',
      },
    ]
    renderGrid(outsideLesson)

    expect(screen.queryByText('Far future lesson')).not.toBeInTheDocument()
  })
})
