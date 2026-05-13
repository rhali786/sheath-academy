import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { ChildSubjectFilter } from '@/features/planner/front/components/ChildSubjectFilter'
import { PlannerContext } from '@/features/planner/front/context/PlannerContext'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

const mockChildren: StudentProfile[] = [
  { id: 'child_001', householdId: 'hh_001', name: 'Adam', gradeLabel: '5th', isActive: true, username: 'adam', password: 'pwd', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'child_002', householdId: 'hh_001', name: 'Khadijah', gradeLabel: '3rd', isActive: true, username: 'khadijah', password: 'pwd', createdAt: '2026-01-01T00:00:00Z' },
]

const mockSubjects: SubjectCourse[] = [
  { id: 'subj_001', childId: 'child_001', name: 'Math', category: 'Math', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'subj_002', childId: 'child_001', name: 'Quran', category: 'Quran', isActive: true, order: 2, createdAt: '2026-01-01T00:00:00Z' },
]

function renderFilter(selectedChildIds = ['child_001', 'child_002'], selectedSubjectIds = ['subj_001', 'subj_002']) {
  const setSelectedChildIds = jest.fn()
  const setSelectedSubjectIds = jest.fn()

  const mockContext = {
    lessons: [],
    selectedWeek: new Date('2026-05-12'),
    setSelectedWeek: jest.fn(),
    selectedChildIds,
    setSelectedChildIds,
    selectedSubjectIds,
    setSelectedSubjectIds,
    isLoading: false,
    error: null,
    weekStartDay: 'Monday' as const,
    children: mockChildren,
    subjects: mockSubjects,
  }

  return {
    ...render(
      <PlannerContext.Provider value={mockContext}>
        <ChildSubjectFilter />
      </PlannerContext.Provider>
    ),
    setSelectedChildIds,
    setSelectedSubjectIds,
  }
}

describe('ChildSubjectFilter', () => {
  it('renders multi-select dropdown for children', () => {
    renderFilter()

    const childButton = screen.getByRole('button', { name: /children:/i })
    expect(childButton).toBeInTheDocument()
  })

  it('renders multi-select dropdown for subjects', () => {
    renderFilter()

    const subjectButton = screen.getByRole('button', { name: /subjects:/i })
    expect(subjectButton).toBeInTheDocument()
  })

  it('selecting a child updates the filter', () => {
    const { setSelectedChildIds } = renderFilter(['child_001'])

    const childButton = screen.getByRole('button', { name: /children:/i })
    fireEvent.click(childButton)

    const adamCheckbox = screen.getByRole('checkbox', { name: /adam/i })
    fireEvent.click(adamCheckbox)

    expect(setSelectedChildIds).toHaveBeenCalled()
  })

  it('selecting a subject updates the filter', () => {
    const { setSelectedSubjectIds } = renderFilter([], ['subj_001'])

    const subjectButton = screen.getByRole('button', { name: /subjects:/i })
    fireEvent.click(subjectButton)

    const mathCheckbox = screen.getByRole('checkbox', { name: /math/i })
    fireEvent.click(mathCheckbox)

    expect(setSelectedSubjectIds).toHaveBeenCalled()
  })

  it('deselecting a child removes it from the filter', () => {
    const { setSelectedChildIds } = renderFilter(['child_001', 'child_002'])

    const childButton = screen.getByRole('button', { name: /children:/i })
    fireEvent.click(childButton)

    const adamCheckbox = screen.getByRole('checkbox', { name: /adam/i })
    fireEvent.click(adamCheckbox)

    expect(setSelectedChildIds).toHaveBeenCalled()
  })

  it('clear button resets to all children and all subjects', () => {
    const { setSelectedChildIds, setSelectedSubjectIds } = renderFilter(['child_001'], ['subj_001'])

    const clearButton = screen.getByRole('button', { name: /clear filters/i })
    fireEvent.click(clearButton)

    expect(setSelectedChildIds).toHaveBeenCalledWith(['child_001', 'child_002'])
    expect(setSelectedSubjectIds).toHaveBeenCalledWith(['subj_001', 'subj_002'])
  })
})
