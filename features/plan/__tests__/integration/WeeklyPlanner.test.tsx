import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { WeeklyPlanner } from '@/features/plan/front/components/WeeklyPlanner'
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
  { id: 'child_002', householdId: 'hh_001', name: 'Layth', gradeLabel: '3rd', isActive: true, username: 'layth', password: 'pwd', createdAt: '2026-01-01T00:00:00Z' },
]

const mockSubjects: SubjectCourse[] = [
  { id: 'subj_001', childId: 'child_001', name: 'Math', category: 'Math', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'subj_002', childId: 'child_002', name: 'Reading', category: 'Reading', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
]

// 2026-05-11 is Monday; 2026-05-12 is Tuesday
const mockLessons: LessonTask[] = [
  {
    id: 'lesson_001',
    childId: 'child_001',
    subjectId: 'subj_001',
    householdId: 'hh_001',
    title: 'Fractions practice',
    dueDate: '2026-05-12',
    status: 'not_started' as const,
    order: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'lesson_002',
    childId: 'child_001',
    subjectId: 'subj_001',
    householdId: 'hh_001',
    title: 'Word problems',
    dueDate: '2026-05-13',
    status: 'not_started' as const,
    order: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'lesson_003',
    childId: 'child_002',
    subjectId: 'subj_002',
    householdId: 'hh_001',
    title: 'Chapter 91',
    resourceLink: 'https://example.com/ch91',
    dueDate: '2026-05-11',
    status: 'completed' as const,
    order: 1,
    estimatedDuration: '30min' as const,
    curriculum: 'All About Reading Level 2',
    chapter: 'Ch. 91',
    hasHomework: true,
    hasAssessment: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'lesson_004',
    childId: 'child_002',
    subjectId: 'subj_002',
    householdId: 'hh_001',
    title: 'Spelling review',
    dueDate: '2026-05-12',
    status: 'skipped' as const,
    order: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

function renderPlanner(overrides: Partial<React.ComponentProps<typeof PlannerContext.Provider>['value']> = {}) {
  const mockContext = {
    lessons: mockLessons,
    selectedWeek: new Date('2026-05-11'),
    setSelectedWeek: jest.fn(),
    selectedChildIds: ['child_001', 'child_002'],
    setSelectedChildIds: jest.fn(),
    selectedSubjectIds: ['subj_001', 'subj_002'],
    setSelectedSubjectIds: jest.fn(),
    isInitializing: false,
    isLessonsLoading: false,
    isLoading: false,
    error: null,
    weekStartDay: 'Monday' as const,
    children: mockChildren,
    subjects: mockSubjects,
    ...overrides,
  }

  return render(
    <PlannerContext.Provider value={mockContext}>
      <WeeklyPlanner />
    </PlannerContext.Provider>
  )
}

describe('WeeklyPlanner', () => {
  it("renders each learner's name/header exactly once, not repeated per lesson", () => {
    renderPlanner()

    expect(screen.getAllByText('Adam')).toHaveLength(1)
    expect(screen.getAllByText('Layth')).toHaveLength(1)
  })

  it('collapsing a learner group hides their lessons, and clicking again expands it', () => {
    renderPlanner()

    expect(screen.getByText('Fractions practice')).toBeInTheDocument()

    const adamHeader = screen.getByRole('button', { name: /adam/i })
    fireEvent.click(adamHeader)
    expect(screen.queryByText('Fractions practice')).not.toBeInTheDocument()

    fireEvent.click(adamHeader)
    expect(screen.getByText('Fractions practice')).toBeInTheDocument()
  })

  it('compresses a day with no lessons for a learner instead of rendering a full empty block', () => {
    renderPlanner()

    // Layth has Monday and Tuesday lessons; the rest of the week should be muted markers,
    // not populated day blocks.
    const laythSection = screen.getByText('Layth').closest('div[data-learner-section]') as HTMLElement
    expect(laythSection).toBeInTheDocument()

    const emptyMarkers = laythSection.querySelectorAll('[data-testid^="day-empty-"]')
    const populatedDays = laythSection.querySelectorAll('[data-testid^="day-lessons-"]')

    expect(emptyMarkers.length).toBeGreaterThan(0)
    expect(populatedDays.length).toBeGreaterThan(0)
  })

  it('a lesson card shows subject, focal line, and a status indicator', () => {
    renderPlanner()

    expect(screen.getAllByText('Reading').length).toBeGreaterThan(0)
    // lesson_003 has a chapter set, so the chapter text is the card's focal line
    expect(screen.getByText('Ch. 91')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('renders the subject eyebrow visually before the focal line within a lesson card', () => {
    renderPlanner()

    const card = screen.getByTestId('lesson-card-lesson_003')
    const focalEl = screen.getByText('Ch. 91')
    expect(card.contains(focalEl)).toBe(true)

    const subjectEl = screen.getAllByText('Reading').find(el => card.contains(el)) as HTMLElement
    expect(subjectEl).toBeInTheDocument()

    // subject eyebrow must precede the focal line in DOM order (teaching-context-first)
    const position = subjectEl.compareDocumentPosition(focalEl)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders a resource indicator only when the lesson has a resourceLink', () => {
    renderPlanner()

    const withResource = screen.getByTestId('lesson-card-lesson_003')
    expect(withResource.querySelector('[data-testid="resource-indicator"]')).toBeInTheDocument()

    const withoutResource = screen.getByText('Word problems').closest('[data-lesson-card]') as HTMLElement
    expect(withoutResource.querySelector('[data-testid="resource-indicator"]')).not.toBeInTheDocument()
  })

  it('status badge uses the same color convention as WeekGrid: green for completed, amber for skipped', () => {
    renderPlanner()

    const completedCard = screen.getByTestId('lesson-card-lesson_003')
    const completedBadge = completedCard.querySelector('[data-testid="status-badge"]') as HTMLElement
    expect(completedBadge).toBeInTheDocument()
    expect(completedBadge.className).toMatch(/bg-green-100/)
    expect(completedBadge.className).toMatch(/text-green-700/)

    const skippedCard = screen.getByText('Spelling review').closest('[data-lesson-card]') as HTMLElement
    const skippedBadge = skippedCard.querySelector('[data-testid="status-badge"]') as HTMLElement
    expect(skippedBadge).toBeInTheDocument()
    expect(skippedBadge.className).toMatch(/bg-amber-100/)
    expect(skippedBadge.className).toMatch(/text-amber-700/)
  })

  it('renders the estimated duration when set', () => {
    renderPlanner()

    const card = screen.getByTestId('lesson-card-lesson_003')
    expect(card).toHaveTextContent('30 min')
  })

  it('respects selectedChildIds/selectedSubjectIds filters, narrowing which learners/lessons appear', () => {
    renderPlanner({ selectedChildIds: ['child_001'], selectedSubjectIds: ['subj_001'] })

    expect(screen.getByText('Adam')).toBeInTheDocument()
    expect(screen.queryByText('Layth')).not.toBeInTheDocument()
    expect(screen.queryByText('Ch. 91')).not.toBeInTheDocument()
  })

  it('renders chapter as the focal line and curriculum as a muted sub-line when chapter is set', () => {
    renderPlanner()

    const card = screen.getByTestId('lesson-card-lesson_003')
    expect(card).toHaveTextContent('Ch. 91')
    expect(card).toHaveTextContent('All About Reading Level 2')
    // title is superseded by chapter as the focal line, not duplicated alongside it
    expect(screen.queryByText('Chapter 91')).not.toBeInTheDocument()
  })

  it('falls back to title as the focal line when chapter is not set', () => {
    renderPlanner()

    const card = screen.getByTestId('lesson-card-lesson_001')
    expect(card).toHaveTextContent('Fractions practice')
  })

  it('renders homework/assessment indicators only when their flags are true, with no placeholder when unset', () => {
    renderPlanner()

    // lesson_003: hasHomework true, hasAssessment false
    const card003 = screen.getByTestId('lesson-card-lesson_003')
    expect(card003.querySelector('[data-testid="homework-indicator"]')).toBeInTheDocument()
    expect(card003.querySelector('[data-testid="assessment-indicator"]')).not.toBeInTheDocument()

    // lesson_001: neither field set
    const card001 = screen.getByTestId('lesson-card-lesson_001')
    expect(card001.querySelector('[data-testid="homework-indicator"]')).not.toBeInTheDocument()
    expect(card001.querySelector('[data-testid="assessment-indicator"]')).not.toBeInTheDocument()
  })
})
