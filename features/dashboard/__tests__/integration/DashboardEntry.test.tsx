import { render, screen } from '@testing-library/react'
import { DashboardEntry } from '@/features/dashboard/front/pages/DashboardEntry'

// UAT 8.3 (2026-10-12): the parent Dashboard's providers load parent-only data, so a learner
// must get "My day" without them ever mounting.
jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))
jest.mock('@/features/dashboard/front/pages/LearnerHome', () => ({ LearnerHome: () => <p>my day</p> }))
jest.mock('@/features/dashboard/front/pages/Dashboard', () => ({ __esModule: true, default: () => <p>parent dashboard</p> }))
jest.mock('@/features/dashboard/front/context', () => ({
  DashboardProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-provider">{children}</div>,
}))
jest.mock('@/features/school-year/front/context/ActiveSchoolYearContext', () => ({
  ActiveSchoolYearProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="school-year-provider">{children}</div>,
}))

import { useSession } from 'next-auth/react'
const mockUseSession = useSession as jest.Mock

function sessionWithRole(role: string) {
  return {
    data: { user: { email: 'x@example.com', householdId: 'hh_a', memberships: [{ householdId: 'hh_a', householdName: 'Barakah Academy', role }] }, expires: '2099-01-01' },
    status: 'authenticated',
  }
}

describe('DashboardEntry', () => {
  it('a learner gets My day, with no parent Dashboard providers mounted', () => {
    mockUseSession.mockReturnValue(sessionWithRole('learner'))
    render(<DashboardEntry />)
    expect(screen.getByText('my day')).toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-provider')).not.toBeInTheDocument()
    expect(screen.queryByTestId('school-year-provider')).not.toBeInTheDocument()
  })

  it('a parent gets the Dashboard', () => {
    mockUseSession.mockReturnValue(sessionWithRole('owner'))
    render(<DashboardEntry />)
    expect(screen.getByText('parent dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-provider')).toBeInTheDocument()
  })

  it('renders neither until the session is known, so a learner never loads parent data', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' })
    render(<DashboardEntry />)
    expect(screen.queryByText('parent dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('my day')).not.toBeInTheDocument()
  })
})
