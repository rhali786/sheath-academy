import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { LearnerSwitcher } from '@/features/layout/front/components/LearnerSwitcher'
import { LearnerProvider, useLearner } from '@/features/layout/front/context/LearnerContext'
import type { StudentProfile } from '@/features/lib/types'

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

import { useHousehold } from '@/features/household/front/context'

const mockUseHousehold = useHousehold as jest.Mock

const learners: StudentProfile[] = [
  {
    id: 'child_a',
    householdId: 'hh_1',
    name: 'Adam',
    gradeLabel: '5th',
    isActive: true,
    username: 'adam',
    password: 'pw',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'child_b',
    householdId: 'hh_1',
    name: 'Khadijah',
    gradeLabel: '3rd',
    isActive: true,
    username: 'khadijah',
    password: 'pw',
    createdAt: '2026-01-01T00:00:00Z',
  },
]

function SelectionStub() {
  const { selectedChildId } = useLearner()
  return <span data-testid="selection-stub">{selectedChildId ?? 'none'}</span>
}

function renderWithLearner(ui: React.ReactElement) {
  return render(<LearnerProvider>{ui}</LearnerProvider>)
}

beforeEach(() => {
  sessionStorage.clear()
  mockUseHousehold.mockImplementation(() => ({
    studentProfiles: learners,
    householdProfile: { id: 'hh_1' },
    loading: false,
  }))
})

describe('LearnerSwitcher', () => {
  test('trigger shows "All children" and a "Learner" caption by default', () => {
    renderWithLearner(<LearnerSwitcher />)
    const trigger = screen.getByTestId('learner-switcher')
    expect(trigger).toHaveTextContent('All children')
    expect(trigger).toHaveTextContent('Learner')
  })

  test('opens a dropdown listing All children plus every active learner', () => {
    renderWithLearner(<LearnerSwitcher />)
    fireEvent.click(screen.getByTestId('learner-switcher'))
    const options = screen.getAllByRole('option')
    const names = options.map(o => o.textContent).join(' ')
    expect(names).toContain('All children')
    expect(names).toContain('Adam')
    expect(names).toContain('Khadijah')
  })

  test('selecting a learner updates selection, persists to sessionStorage, and shows their name on the trigger', () => {
    renderWithLearner(
      <>
        <LearnerSwitcher />
        <SelectionStub />
      </>,
    )
    expect(screen.getByTestId('selection-stub')).toHaveTextContent('none')

    fireEvent.click(screen.getByTestId('learner-switcher'))
    fireEvent.click(screen.getByRole('option', { name: /khadijah/i }))

    expect(screen.getByTestId('selection-stub')).toHaveTextContent('child_b')
    expect(sessionStorage.getItem('sheath.selectedChildId')).toBe('child_b')
    expect(screen.getByTestId('learner-switcher')).toHaveTextContent('Khadijah')
  })

  test('selecting "All children" clears the selection', () => {
    sessionStorage.setItem('sheath.selectedChildId', 'child_a')
    renderWithLearner(
      <>
        <LearnerSwitcher />
        <SelectionStub />
      </>,
    )

    fireEvent.click(screen.getByTestId('learner-switcher'))
    fireEvent.click(screen.getByRole('option', { name: /all children/i }))

    expect(screen.getByTestId('selection-stub')).toHaveTextContent('none')
    expect(sessionStorage.getItem('sheath.selectedChildId')).toBeNull()
  })

  test('hidden when fewer than two learners', () => {
    mockUseHousehold.mockImplementation(() => ({
      studentProfiles: [learners[0]],
      householdProfile: { id: 'hh_1' },
      loading: false,
    }))
    renderWithLearner(<LearnerSwitcher />)
    expect(screen.queryByTestId('learner-switcher')).not.toBeInTheDocument()
  })
})
