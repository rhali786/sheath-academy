import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Header } from '@/features/layout/front/components/Header'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

import { useSession, signOut } from 'next-auth/react'

const mockUseSession = useSession as jest.Mock
const mockSignOut = signOut as jest.Mock

describe('Header — unauthenticated', () => {
  beforeEach(() => {
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

  test('renders notification bell stub', () => {
    render(<Header />)
    expect(screen.getByTestId('notification-bell-stub')).toBeInTheDocument()
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

  test('clicking Sign out calls signOut()', () => {
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})

describe('Header — mobile menu trigger', () => {
  beforeEach(() => {
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
