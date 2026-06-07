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

const defaultProps = {
  selectedDate: '2026-05-24',
  onDateChange: jest.fn(),
}

describe('DashboardHeader', () => {
  test('renders greeting with session first name', () => {
    render(<DashboardHeader {...defaultProps} />)
    expect(screen.getByText(/Assalamu alaikum, Aisha/)).toBeInTheDocument()
  })

  test('renders date picker and header shell', () => {
    render(<DashboardHeader {...defaultProps} />)
    expect(screen.getByTestId('dashboard-date-picker')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument()
  })

  test('Quick Add menu opens with titled panel and action links', () => {
    render(<DashboardHeader {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /quick add/i }))
    expect(screen.getByTestId('quick-add-menu')).toBeInTheDocument()
    expect(screen.getByRole('menu').querySelector('p')).toHaveTextContent('Quick Add')
    expect(screen.getByRole('menuitem', { name: /log quran/i })).toHaveAttribute('href', '/quran')
    expect(screen.getByRole('menuitem', { name: /mark attendance/i })).toHaveAttribute('href', '/attendance')
    expect(screen.getByRole('menuitem', { name: /add lesson/i })).toHaveAttribute('href', '/lessons')
  })

  test('Quick Add menu closes after clicking a link', () => {
    render(<DashboardHeader {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /quick add/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /log quran/i }))
    expect(screen.queryByTestId('quick-add-menu')).not.toBeInTheDocument()
  })

  test("Today's Plan links to /plan", () => {
    render(<DashboardHeader {...defaultProps} />)
    expect(screen.getByRole('link', { name: /today's plan/i })).toHaveAttribute('href', '/plan')
  })

  test('DashboardHeader does not render its own notification bell (bell is in global Header)', () => {
    render(<DashboardHeader {...defaultProps} />)
    expect(screen.queryByTestId('dashboard-notification-bell')).not.toBeInTheDocument()
  })
})
