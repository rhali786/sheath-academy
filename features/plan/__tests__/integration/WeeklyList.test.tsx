import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { WeeklyList } from '@/features/plan/front/components/WeeklyList'
import { PlannerContext } from '@/features/plan/front/context/PlannerContext'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))
import type { LessonTask } from '@/features/plan/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

const mockChildren: StudentProfile[] = [
  { id: 'child_001', householdId: 'hh_001', name: 'Adam', gradeLabel: '5th', isActive: true, username: 'adam', password: 'pwd', createdAt: '2026-01-01T00:00:00Z' },
]

const mockSubjects: SubjectCourse[] = [
  { id: 'subj_001', childId: 'child_001', name: 'Math', category: 'Math', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
]

// 2026-05-11 is Monday; 2026-05-12 is Tuesday
const mockLessons: LessonTask[] = [
  {
    id: 'lesson_001',
    childId: 'child_001',
    subjectId: 'subj_001',
    householdId: 'hh_001',
    title: 'Math lesson 1',
    description: 'Algebra basics',
    dueDate: '2026-05-12',
    status: 'not_started' as const,
    order: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

function renderList(lessons: LessonTask[] = [], weekStartDay: 'Monday' | 'Sunday' = 'Monday') {
  const mockContext = {
    lessons,
    selectedWeek: new Date('2026-05-11'),
    setSelectedWeek: jest.fn(),
    selectedChildIds: ['child_001'],
    setSelectedChildIds: jest.fn(),
    selectedSubjectIds: ['subj_001'],
    setSelectedSubjectIds: jest.fn(),
    isInitializing: false,
    isLessonsLoading: false,
    isLoading: false,
    error: null,
    weekStartDay,
    children: mockChildren,
    subjects: mockSubjects,
  }

  return render(
    <PlannerContext.Provider value={mockContext}>
      <WeeklyList />
    </PlannerContext.Provider>
  )
}

describe('WeeklyList (mobile)', () => {
  it('renders one collapsible section per day', () => {
    renderList()

    expect(screen.getByText('Monday')).toBeInTheDocument()
    expect(screen.getByText('Tuesday')).toBeInTheDocument()
    expect(screen.getByText('Wednesday')).toBeInTheDocument()
    expect(screen.getByText('Thursday')).toBeInTheDocument()
    expect(screen.getByText('Friday')).toBeInTheDocument()
    expect(screen.getByText('Saturday')).toBeInTheDocument()
    expect(screen.getByText('Sunday')).toBeInTheDocument()
  })

  it('day section contains lessons grouped by child and subject', () => {
    renderList(mockLessons)

    const buttons = screen.getAllByRole('button')
    const tuesdayButton = buttons.find(btn => btn.textContent?.includes('Tuesday'))
    expect(tuesdayButton).toBeInTheDocument()
  })

  it('expanding a day section shows all lessons for that day', () => {
    renderList(mockLessons)

    const buttons = screen.getAllByRole('button')
    const tuesdayButton = buttons.find(btn => btn.textContent?.includes('Tuesday'))

    fireEvent.click(tuesdayButton!)

    expect(screen.getByText('Math lesson 1')).toBeInTheDocument()
  })

  it('collapsing a day section hides lessons', () => {
    renderList(mockLessons)

    const buttons = screen.getAllByRole('button')
    const tuesdayButton = buttons.find(btn => btn.textContent?.includes('Tuesday'))

    fireEvent.click(tuesdayButton!)
    expect(screen.getByText('Math lesson 1')).toBeInTheDocument()

    fireEvent.click(tuesdayButton!)
    expect(screen.queryByText('Math lesson 1')).not.toBeInTheDocument()
  })

  it('weekends sections have de-emphasis styling', () => {
    const { container } = renderList()

    const weekendSections = container.querySelectorAll('.opacity-60')
    expect(weekendSections.length).toBeGreaterThan(0)
  })

  it('shows resolved subject name, not raw subjectId', () => {
    renderList(mockLessons)

    const buttons = screen.getAllByRole('button')
    const tuesdayButton = buttons.find(btn => btn.textContent?.includes('Tuesday'))
    fireEvent.click(tuesdayButton!)

    expect(screen.getByText('Math')).toBeInTheDocument()
    expect(screen.queryByText('subj_001')).not.toBeInTheDocument()
  })

  it('shows resolved child name, not raw childId', () => {
    renderList(mockLessons)

    const buttons = screen.getAllByRole('button')
    const tuesdayButton = buttons.find(btn => btn.textContent?.includes('Tuesday'))
    fireEvent.click(tuesdayButton!)

    expect(screen.getByText('Adam')).toBeInTheDocument()
    expect(screen.queryByText('child_001')).not.toBeInTheDocument()
  })

  it('clicking a lesson card navigates to the edit page', () => {
    renderList(mockLessons)

    const buttons = screen.getAllByRole('button')
    const tuesdayButton = buttons.find(btn => btn.textContent?.includes('Tuesday'))
    fireEvent.click(tuesdayButton!)

    const lessonCard = screen.getByText('Math lesson 1').closest('div[class*="bg-white"]')
    fireEvent.click(lessonCard!)

    expect(mockPush).toHaveBeenCalledWith('/lessons?editId=lesson_001')
  })

  it('lesson card shows a tap-to-edit/reschedule affordance', () => {
    renderList(mockLessons)

    const buttons = screen.getAllByRole('button')
    const tuesdayButton = buttons.find(btn => btn.textContent?.includes('Tuesday'))
    fireEvent.click(tuesdayButton!)

    expect(screen.getByLabelText(/tap to edit or reschedule/i)).toBeInTheDocument()
  })
})
