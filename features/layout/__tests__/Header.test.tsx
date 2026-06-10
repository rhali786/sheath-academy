import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Header } from '@/features/layout/front/components/Header'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('@/features/dashboard/front/components/NotificationBellDropdown', () => ({
  NotificationBellDropdown: ({ alerts }: { alerts: unknown[] }) => (
    <div data-testid="dashboard-notification-bell" data-alert-count={alerts.length} />
  ),
}))

jest.mock('@/features/layout/front/components/LearnerSwitcher', () => ({
  LearnerSwitcher: () => null,
}))

jest.mock('@/features/household/front/components/HouseholdSwitcher', () => ({
  HouseholdSwitcher: () => null,
}))

import { useSession, signOut } from 'next-auth/react'

const mockUseSession = useSession as jest.Mock
const mockSignOut = signOut as jest.Mock

function mockFetchEmpty() {
  ;(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: [] }),
  })
}

describe('Header — unauthenticated', () => {
  beforeEach(() => {
    mockFetchEmpty()
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
  })

  test('renders Sign in link pointing to /login', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
  })

  test('does not render sign-out button', () => {
    render(<Header />)
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
  })

  test('renders notification bell on every route', () => {
    render(<Header />)
    expect(screen.getByTestId('dashboard-notification-bell')).toBeInTheDocument()
  })

  test('renders notification bell on the dashboard route too (no more isDashboard guard)', () => {
    render(<Header />)
    expect(screen.getByTestId('dashboard-notification-bell')).toBeInTheDocument()
    expect(screen.queryByTestId('notification-bell-stub')).not.toBeInTheDocument()
  })
})

describe('Header — authenticated', () => {
  const session = {
    user: { name: 'Naeem Parent', email: 'parent@example.com', image: null },
    expires: '9999-01-01',
  }

  beforeEach(() => {
    mockFetchEmpty()
    mockUseSession.mockReturnValue({ data: session, status: 'authenticated' })
    mockSignOut.mockClear()
  })

  test('renders Arabic greeting with full name and email when signed in', () => {
    render(<Header />)
    const greetingLine = screen.getByTestId('user-greeting-line')
    expect(greetingLine).toBeInTheDocument()
    expect(greetingLine.textContent).toContain('Naeem Parent')
    expect(greetingLine.textContent).toContain('parent@example.com')
  })

  test('renders "there" fallback and email in parens when user has no name', () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'parent@example.com', image: null }, expires: '9999-01-01' },
      status: 'authenticated',
    })
    render(<Header />)
    const greetingLine = screen.getByTestId('user-greeting-line')
    expect(greetingLine.textContent).toMatch(/there/i)
    expect(greetingLine.textContent).toContain('parent@example.com')
  })

  test('greetings helper returns a value from the configured set', () => {
    const { GREETINGS, pickGreeting } = require('@/features/layout/lib/greetings')
    for (let i = 0; i < GREETINGS.length; i++) {
      expect(GREETINGS).toContain(pickGreeting(i))
    }
  })

  test('clicking Sign out calls signOut()', () => {
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})

describe('Header — mobile menu trigger', () => {
  beforeEach(() => {
    mockFetchEmpty()
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
  })

  test('calls onMenuOpen when hamburger is clicked', () => {
    const onMenuOpen = jest.fn()
    render(<Header onMenuOpen={onMenuOpen} />)
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }))
    expect(onMenuOpen).toHaveBeenCalledTimes(1)
  })
})

describe('Header — app header height sync', () => {
  let resizeObserverCallback: ResizeObserverCallback | null = null

  beforeEach(() => {
    resizeObserverCallback = null
    document.documentElement.style.removeProperty('--app-header-height')
    class MockResizeObserver {
      observe = jest.fn()
      disconnect = jest.fn()
      constructor(cb: ResizeObserverCallback) {
        resizeObserverCallback = cb
      }
    }
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver
    mockFetchEmpty()
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
  })

  afterEach(() => {
    document.documentElement.style.removeProperty('--app-header-height')
  })

  test('sets --app-header-height from the rendered header element', async () => {
    render(<Header />)
    const header = document.querySelector('header') as HTMLElement
    Object.defineProperty(header, 'offsetHeight', {
      configurable: true,
      value: 56,
    })
    resizeObserverCallback?.([], {} as ResizeObserver)
    await waitFor(() => {
      expect(
        document.documentElement.style.getPropertyValue('--app-header-height')
      ).toBe('56px')
    })
  })
})
