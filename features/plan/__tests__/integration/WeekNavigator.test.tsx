import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { WeekNavigator } from '@/features/plan/front/components/WeekNavigator'
import { PlannerContext } from '@/features/plan/front/context/PlannerContext'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

const mockChildren: StudentProfile[] = []
const mockSubjects: SubjectCourse[] = []

function renderNavigator(selectedWeek = new Date('2026-05-12'), weekStartDay: 'Monday' | 'Sunday' = 'Monday') {
  const setSelectedWeek = jest.fn()

  const mockContext = {
    lessons: [],
    selectedWeek,
    setSelectedWeek,
    selectedChildIds: [],
    setSelectedChildIds: jest.fn(),
    selectedSubjectIds: [],
    setSelectedSubjectIds: jest.fn(),
    isLoading: false,
    error: null,
    weekStartDay,
    children: mockChildren,
    subjects: mockSubjects,
  }

  return {
    ...render(
      <PlannerContext.Provider value={mockContext}>
        <WeekNavigator />
      </PlannerContext.Provider>
    ),
    setSelectedWeek,
  }
}

describe('WeekNavigator', () => {
  it('previous button navigates to the prior week', () => {
    const { setSelectedWeek } = renderNavigator()

    const prevButton = screen.getByRole('button', { name: /previous week/i })
    fireEvent.click(prevButton)

    expect(setSelectedWeek).toHaveBeenCalled()
  })

  it('next button navigates to the following week', () => {
    const { setSelectedWeek } = renderNavigator()

    const nextButton = screen.getByRole('button', { name: /next week/i })
    fireEvent.click(nextButton)

    expect(setSelectedWeek).toHaveBeenCalled()
  })

  it('date picker opens and allows selecting a new week start', () => {
    renderNavigator()

    const dateButton = screen.getByRole('button', { name: /open date picker/i })
    fireEvent.click(dateButton)

    const dateInput = screen.getByDisplayValue('2026-05-12') as HTMLInputElement
    expect(dateInput).toBeInTheDocument()
    expect(dateInput.type).toBe('date')
  })

  it('jump-to-today button sets week to current week', () => {
    const { setSelectedWeek } = renderNavigator()

    const todayButton = screen.getByRole('button', { name: /jump to today/i })
    fireEvent.click(todayButton)

    expect(setSelectedWeek).toHaveBeenCalled()
  })

  it('displays current week range in header (Mon–Sun based on weekStartDay)', () => {
    renderNavigator(new Date('2026-05-12'), 'Monday')

    const weekRange = screen.getByText(/May.*May/)
    expect(weekRange).toBeInTheDocument()
  })
})
