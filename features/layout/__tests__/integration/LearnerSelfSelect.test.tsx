import { render, screen, waitFor } from '@testing-library/react'
import { LearnerProvider, useLearner } from '@/features/layout/front/context/LearnerContext'
import { LearnerSelfSelect } from '@/features/layout/front/components/LearnerSelfSelect'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))
jest.mock('@/features/household/front/context', () => ({ useHousehold: jest.fn() }))

import { useSession } from 'next-auth/react'
import { useHousehold } from '@/features/household/front/context'

const mockUseSession = useSession as jest.Mock
const mockUseHousehold = useHousehold as jest.Mock

function sessionWithRole(role: string) {
  return {
    data: { user: { email: 'x@example.com', householdId: 'hh_a', memberships: [{ householdId: 'hh_a', householdName: 'Barakah Academy', role }] }, expires: '2099-01-01' },
    status: 'authenticated',
  }
}

function SelectedId() {
  const { selectedChildId } = useLearner()
  return <p data-testid="selected">{selectedChildId ?? 'all'}</p>
}

function renderShell() {
  return render(
    <LearnerProvider>
      <LearnerSelfSelect />
      <SelectedId />
    </LearnerProvider>,
  )
}

// UAT 8.3 (2026-10-12): a learner's pages loaded the first child in the household (a
// sibling), and the server refused them. A learner's selection is always themselves.
describe('LearnerSelfSelect', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mockUseHousehold.mockImplementation(() => ({ studentProfiles: [{ id: 'learner_self', name: 'Yusuf', isActive: true }], loading: false }))
  })

  it('selects the learner themselves', async () => {
    mockUseSession.mockImplementation(() => sessionWithRole('learner'))
    renderShell()
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('learner_self'))
  })

  it('replaces a sibling left selected in this tab by a parent', async () => {
    sessionStorage.setItem('sheath.selectedChildId', 'learner_sibling')
    mockUseSession.mockImplementation(() => sessionWithRole('learner'))
    renderShell()
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('learner_self'))
  })

  it('leaves a parent’s choice alone', async () => {
    mockUseSession.mockImplementation(() => sessionWithRole('owner'))
    mockUseHousehold.mockImplementation(() => ({ studentProfiles: [{ id: 'learner_a' }, { id: 'learner_b' }], loading: false }))
    renderShell()
    expect(screen.getByTestId('selected')).toHaveTextContent('all')
  })

  it('waits while the household is still loading', () => {
    mockUseSession.mockImplementation(() => sessionWithRole('learner'))
    mockUseHousehold.mockImplementation(() => ({ studentProfiles: [], loading: true }))
    renderShell()
    expect(screen.getByTestId('selected')).toHaveTextContent('all')
  })
})
