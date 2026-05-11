import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '@/features/layout/front/components/Header'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(() => ({
    familyName: '',
    needsSetup: false,
    loading: false,
    error: null,
    refetch: jest.fn(),
  })),
}))

jest.mock('@/features/layout/front/context/NavigationContext', () => ({
  useNavigation: jest.fn(() => ({
    selectedTab: 'Today',
    setSelectedTab: jest.fn(),
  })),
}))

import { useSession, signOut } from 'next-auth/react'
import { useHousehold } from '@/features/household/front/context'
import { useNavigation } from '@/features/layout/front/context/NavigationContext'
const mockUseSession = useSession as jest.Mock
const mockSignOut = signOut as jest.Mock
const mockUseHousehold = useHousehold as jest.Mock
const mockUseNavigation = useNavigation as jest.Mock

describe('Header — unauthenticated', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
  })

  test('renders logo and brand name', () => {
    render(<Header />)
    expect(screen.getByText('Sheath Academy')).toBeInTheDocument()
  })

  test('renders Sign in link pointing to /login', () => {
    render(<Header />)
    const link = screen.getByRole('link', { name: /sign in/i })
    expect(link).toHaveAttribute('href', '/login')
  })

  test('does not render sign-out button', () => {
    render(<Header />)
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
    render(<Header />)
    expect(screen.getByText('parent@example.com')).toBeInTheDocument()
  })

  test('does not render Sign in link when authenticated', () => {
    render(<Header />)
    expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument()
  })

  test('clicking Sign out calls signOut()', () => {
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})

describe('Header — version display', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
  })

  test('renders version string next to brand name', () => {
    render(<Header />)
    expect(screen.getByText(/v0\.\d+\.\d+/)).toBeInTheDocument()
  })
})

describe('Header — household name', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
  })

  test('shows "Home Education" when no household is set up', () => {
    render(<Header />)
    expect(screen.getByText('Home Education')).toBeInTheDocument()
  })

  test('shows the household name from context when set up', () => {
    mockUseHousehold.mockReturnValueOnce({ familyName: 'Ahmed Academy', needsSetup: false, loading: false, error: null, refetch: jest.fn() })
    render(<Header />)
    expect(screen.getByText('Ahmed Academy')).toBeInTheDocument()
    expect(screen.queryByText('Home Education')).not.toBeInTheDocument()
  })
})

describe('Header — tab navigation', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
  })

  test('renders all four nav tabs on desktop', () => {
    render(<Header />)
    ;['Today', 'Weekly', 'Reports', 'Settings'].forEach((tab) => {
      expect(screen.getAllByRole('button', { name: tab }).length).toBeGreaterThan(0)
    })
  })

  test('active tab has distinct active styling', () => {
    mockUseNavigation.mockReturnValueOnce({ selectedTab: 'Weekly', setSelectedTab: jest.fn() })
    render(<Header />)
    const weeklyButtons = screen.getAllByRole('button', { name: 'Weekly' })
    expect(weeklyButtons.some((b) => b.className.includes('bg-forest-900'))).toBe(true)
  })

  test('clicking a desktop tab calls setSelectedTab', () => {
    const setSelectedTab = jest.fn()
    mockUseNavigation.mockReturnValueOnce({ selectedTab: 'Today', setSelectedTab })
    render(<Header />)
    const reportsButtons = screen.getAllByRole('button', { name: 'Reports' })
    fireEvent.click(reportsButtons[0])
    expect(setSelectedTab).toHaveBeenCalledWith('Reports')
  })
})
