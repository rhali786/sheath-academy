import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardHeader } from '@/features/dashboard/front/components/DashboardHeader'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { name: 'Aisha Parent', email: 'aisha@example.com' } },
    status: 'authenticated',
  })),
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(() => ({
    familyName: 'Barakah Academy',
    householdProfile: { id: 'hh_001' },
    loading: false,
    needsSetup: false,
    error: null,
    refetch: jest.fn(),
  })),
}))

jest.mock('@/features/dashboard/front/components/ChildSelector', () => ({
  ChildSelector: () => <div data-testid="child-selector-stub" />,
}))

describe('DashboardHeader', () => {
  test('renders greeting with session first name', () => {
    render(<DashboardHeader />)
    expect(screen.getByText(/Assalamu alaikum, Aisha/)).toBeInTheDocument()
  })

  test('renders gregorian and hijri dates', () => {
    render(<DashboardHeader />)
    expect(screen.getByTestId('dashboard-gregorian-date')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument()
  })

  test('Quick Add menu opens with action links', () => {
    render(<DashboardHeader />)
    fireEvent.click(screen.getByRole('button', { name: /quick add/i }))
    const menu = screen.getByTestId('quick-add-menu')
    expect(menu).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /log quran/i })).toHaveAttribute('href', '/quran')
    expect(screen.getByRole('menuitem', { name: /mark attendance/i })).toHaveAttribute('href', '/attendance')
    expect(screen.getByRole('menuitem', { name: /add lesson/i })).toHaveAttribute('href', '/lessons')
  })

  test('Today\'s Plan links to /plan', () => {
    render(<DashboardHeader />)
    expect(screen.getByRole('link', { name: /today's plan/i })).toHaveAttribute('href', '/plan')
  })
})
