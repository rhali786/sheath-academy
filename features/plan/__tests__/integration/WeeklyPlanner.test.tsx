import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { WeeklyPlanner } from '@/features/plan/front/components/WeeklyPlanner'
import { PlannerContext } from '@/features/plan/front/context/PlannerContext'

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

// 2026-05-11 is Monday; 2026-05-12 is Tuesday; 2026-05-13 is Wednesday
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

const mockRefreshLessons = jest.fn()

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
    refreshLessons: mockRefreshLessons,
    ...overrides,
  }

  return render(
    <PlannerContext.Provider value={mockContext}>
      <WeeklyPlanner />
    </PlannerContext.Provider>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCapturedDragEnd = null
})

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

  it('lesson card shows a drag-to-reschedule affordance', () => {
    renderPlanner()

    expect(screen.getAllByLabelText(/drag to reschedule/i).length).toBeGreaterThan(0)
  })

  it('dragging a lesson card from Tuesday to Wednesday updates its date and re-renders it under Wednesday', () => {
    const { rerender } = renderPlanner()

    // lesson_001 (Adam / Fractions practice) starts on Tuesday 2026-05-12
    expect(screen.getByTestId('day-lessons-child_001-2026-05-12')).toHaveTextContent('Fractions practice')

    expect(mockCapturedDragEnd).not.toBeNull()

    return mockCapturedDragEnd!({
      active: { id: 'lesson_001', data: { current: {} } },
      over: {
        id: 'child_001:2026-05-13',
        data: { current: { dateStr: '2026-05-13' } },
      },
    }).then(() => {
      expect(mockUpdateLesson).toHaveBeenCalledWith('lesson_001', { dueDate: '2026-05-13' })
      expect(mockRefreshLessons).toHaveBeenCalled()

      // Simulate the refreshLessons()-driven refetch bringing back the lesson with its new date.
      const updatedLessons = mockLessons.map(l =>
        l.id === 'lesson_001' ? { ...l, dueDate: '2026-05-13' } : l,
      )
      rerender(
        <PlannerContext.Provider
          value={{
            lessons: updatedLessons,
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
            weekStartDay: 'Monday',
            children: mockChildren,
            subjects: mockSubjects,
            refreshLessons: mockRefreshLessons,
          }}
        >
          <WeeklyPlanner />
        </PlannerContext.Provider>,
      )

      expect(screen.getByTestId('day-lessons-child_001-2026-05-13')).toHaveTextContent('Fractions practice')
      expect(screen.queryByTestId('day-lessons-child_001-2026-05-12')).not.toBeInTheDocument()
    })
  })

  it("switching to 'By day' mode shows Child A and Child B's lessons together under a given date, color-coded by learner; switching back to 'By learner' restores the stacked-per-child layout with no lessons duplicated or dropped", async () => {
    renderPlanner()

    // Default is "By learner": per-learner sections exist, no combined view container.
    expect(screen.queryByTestId('planner-combined-view')).not.toBeInTheDocument()
    expect(screen.getAllByText('Adam')).toHaveLength(1)
    expect(screen.getAllByText('Layth')).toHaveLength(1)

    await userEvent.click(screen.getByTestId('planner-display-mode-byDay'))

    // Both learners' Monday lessons appear together under the same combined day column.
    const mondayColumn = screen.getByTestId('combined-day-lessons-2026-05-11')
    expect(mondayColumn).toHaveTextContent('Ch. 91') // child_002 (Layth) lesson_003, due Monday

    // learner badges are color-coded per learnerColor()
    const badge = mondayColumn.querySelector('[data-testid="combined-learner-badge-lesson_003"]') as HTMLElement
    expect(badge).toBeInTheDocument()
    expect(badge.getAttribute('style')).toMatch(/background-color/i)

    // "By learner" per-child sections are gone while in combined mode.
    expect(screen.queryByTestId('day-lessons-child_002-2026-05-11')).not.toBeInTheDocument()

    // No lessons duplicated or dropped: every lesson still renders exactly once across the week.
    expect(screen.getAllByTestId('lesson-card-lesson_001')).toHaveLength(1)
    expect(screen.getAllByTestId('lesson-card-lesson_002')).toHaveLength(1)
    expect(screen.getAllByTestId('lesson-card-lesson_003')).toHaveLength(1)
    expect(screen.getAllByTestId('lesson-card-lesson_004')).toHaveLength(1)

    await userEvent.click(screen.getByTestId('planner-display-mode-byLearner'))

    // Switching back restores the stacked-per-learner layout with nothing duplicated or dropped.
    expect(screen.queryByTestId('planner-combined-view')).not.toBeInTheDocument()
    expect(screen.getAllByText('Adam')).toHaveLength(1)
    expect(screen.getAllByText('Layth')).toHaveLength(1)
    expect(screen.getAllByTestId('lesson-card-lesson_001')).toHaveLength(1)
    expect(screen.getAllByTestId('lesson-card-lesson_003')).toHaveLength(1)
  })
})
