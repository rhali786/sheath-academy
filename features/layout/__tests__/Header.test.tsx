import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '@/features/layout/front/components/Header'

// next-auth/react is mocked per-test via jest.mock overrides
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

import { useSession, signOut } from 'next-auth/react'
const mockUseSession = useSession as jest.Mock
const mockSignOut = signOut as jest.Mock

const defaultProps = {
  onTabChange: jest.fn(),
  selectedTab: 'Today',
}

describe('Header — unauthenticated', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
  })

  test('renders logo and brand name', () => {
    render(<Header {...defaultProps} />)
    expect(screen.getByText('Sheath Academy')).toBeInTheDocument()
  })

  test('renders Sign in link pointing to /login', () => {
    render(<Header {...defaultProps} />)
    const link = screen.getByRole('link', { name: /sign in/i })
    expect(link).toHaveAttribute('href', '/login')
  })

  test('does not render sign-out button', () => {
    render(<Header {...defaultProps} />)
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
  })
})

describe('Header — authenticated', () => {
  const session = {
    user: { name: 'Naeem Parent', email: 'parent@example.com', image: null },
    expires: '9999-01-01',
  }

  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: session, status: 'authenticated' })
    mockSignOut.mockClear()
  })

  test('renders user email when signed in', () => {
    render(<Header {...defaultProps} />)
    expect(screen.getByText('parent@example.com')).toBeInTheDocument()
  })

  test('does not render Sign in link when authenticated', () => {
    render(<Header {...defaultProps} />)
    expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument()
  })

  test('clicking Sign out calls signOut()', () => {
    render(<Header {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})

describe('Header — tab navigation', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
  })

  test('renders all four nav tabs on desktop', () => {
    render(<Header {...defaultProps} />)
    ;['Today', 'Weekly', 'Reports', 'Settings'].forEach((tab) => {
      // tabs appear in both desktop and mobile markup — getAllByRole
      expect(screen.getAllByRole('button', { name: tab }).length).toBeGreaterThan(0)
    })
  })

  test('active tab has distinct active styling', () => {
    render(<Header {...defaultProps} selectedTab="Weekly" />)
    const weeklyButtons = screen.getAllByRole('button', { name: 'Weekly' })
    // at least one button must carry active class
    expect(weeklyButtons.some((b) => b.className.includes('bg-forest-900'))).toBe(true)
  })

  test('clicking a desktop tab calls onTabChange', () => {
    const onTabChange = jest.fn()
    render(<Header {...defaultProps} onTabChange={onTabChange} />)
    const reportsButtons = screen.getAllByRole('button', { name: 'Reports' })
    fireEvent.click(reportsButtons[0])
    expect(onTabChange).toHaveBeenCalledWith('Reports')
  })
})
