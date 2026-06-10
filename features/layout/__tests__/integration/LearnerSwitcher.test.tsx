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
  test('includes All children option and clears sessionStorage when selected', () => {
    sessionStorage.setItem('sheath.selectedChildId', 'child_a')
    renderWithLearner(
      <>
        <LearnerSwitcher />
        <SelectionStub />
      </>,
    )
    fireEvent.change(screen.getByLabelText('Viewing learner'), { target: { value: 'child_b' } })
    expect(sessionStorage.getItem('sheath.selectedChildId')).toBe('child_b')
    fireEvent.change(screen.getByLabelText('Viewing learner'), { target: { value: '' } })
    expect(screen.getByTestId('selection-stub')).toHaveTextContent('none')
    expect(sessionStorage.getItem('sheath.selectedChildId')).toBeNull()
  })

  test('changes selection and persists to sessionStorage', () => {
    renderWithLearner(
      <>
        <LearnerSwitcher />
        <SelectionStub />
      </>,
    )
    expect(screen.getByTestId('selection-stub')).toHaveTextContent('none')
    fireEvent.change(screen.getByLabelText('Viewing learner'), { target: { value: 'child_b' } })
    expect(screen.getByTestId('selection-stub')).toHaveTextContent('child_b')
    expect(sessionStorage.getItem('sheath.selectedChildId')).toBe('child_b')
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
