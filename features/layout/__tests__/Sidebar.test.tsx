import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { Sidebar } from '@/features/layout/front/components/Sidebar'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
}))

jest.mock('@/features/messaging/front/hooks/useUnreadMessages', () => ({
  useUnreadMessages: jest.fn(() => ({ count: 0 })),
}))

import { usePathname, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useUnreadMessages } from '@/features/messaging/front/hooks/useUnreadMessages'

const mockUsePathname = usePathname as jest.Mock
const mockUseSearchParams = useSearchParams as jest.Mock
const mockUseSession = useSession as jest.Mock
const mockUseUnreadMessages = useUnreadMessages as jest.Mock

describe('Sidebar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
    mockUseSearchParams.mockReturnValue(new URLSearchParams())
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    mockUseUnreadMessages.mockReturnValue({ count: 0 })
    process.env.NEXT_PUBLIC_APP_VERSION = '2.0.0'
  })

  afterEach(() => {
    mockUseUnreadMessages.mockReturnValue({ count: 0 })
  })

  test('renders brand Sheath and tagline', () => {
    render(<Sidebar />)
    expect(screen.getByText('Sheath')).toBeInTheDocument()
    expect(screen.getByText('Faith. Learning. Purpose.')).toBeInTheDocument()
    expect(screen.getByTestId('sheath-logo')).toBeInTheDocument()
  })

  test('renders icon badge for each nav item', () => {
    render(<Sidebar />)
    expect(screen.getByTestId('nav-icon-dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('nav-icon-lesson-planner')).toBeInTheDocument()
    expect(screen.getByTestId('nav-icon-messages')).toBeInTheDocument()
    expect(screen.getByTestId('nav-icon-settings')).toBeInTheDocument()
  })

  test('renders Hijri date under logo', () => {
    render(<Sidebar />)
    expect(screen.getByTestId('sidebar-hijri-date')).toBeInTheDocument()
  })

  test('renders main nav links', () => {
    render(<Sidebar />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'Lesson Planner' })).toHaveAttribute('href', '/plan')
    expect(screen.getByRole('link', { name: 'Courses' })).toHaveAttribute('href', '/lessons')
    expect(screen.getByRole('link', { name: 'Quran' })).toHaveAttribute('href', '/quran')
  })

  test('renders footer nav links for non-admin', () => {
    render(<Sidebar />)
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })

  test('hides Admin link from non-admin users', () => {
    render(<Sidebar />)
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })

  test('shows Admin link for admin users', () => {
    mockUseSession.mockReturnValue({
      data: { user: { isAdmin: true } },
      status: 'authenticated',
    })
    render(<Sidebar />)
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin/metrics')
  })

  test('renders muted app version centered in the sidebar footer', () => {
    render(<Sidebar />)
    const versionEl = screen.getByTestId('sidebar-version')
    expect(versionEl).toHaveTextContent('v2.0.0')
    expect(versionEl.className).toContain('text-center')
  })

  test('Hijri date block is centered under the tagline', () => {
    render(<Sidebar />)
    const hijri = screen.getByTestId('sidebar-hijri-date')
    expect(hijri.className).toContain('text-center')
  })

  test('collapse toggle is present and collapses then expands the sidebar panel', () => {
    render(<Sidebar />)
    // Panel is expanded — nav links visible
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    // Click collapse
    fireEvent.click(screen.getByTestId('sidebar-collapse-toggle'))
    // Nav links gone from expanded panel
    expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument()
    // Expand again
    fireEvent.click(screen.getByTestId('sidebar-collapse-toggle'))
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
  })

  test('disabled Finances is not a link', () => {
    render(<Sidebar />)
    expect(screen.queryByRole('link', { name: /finances/i })).not.toBeInTheDocument()
    expect(screen.getByTestId('nav-disabled-finances')).toHaveAttribute('aria-disabled', 'true')
  })

  test('Messages nav item is enabled and is a link to /messages', () => {
    render(<Sidebar />)
    const link = screen.getByRole('link', { name: /messages/i })
    expect(link).toHaveAttribute('href', '/messages')
    expect(screen.queryByTestId('nav-disabled-messages')).not.toBeInTheDocument()
  })

  test('Sidebar badge shows live unread count when count > 0', () => {
    mockUseUnreadMessages.mockReturnValue({ count: 5 })
    render(<Sidebar />)
    const badge = screen.getByTestId('nav-badge-messages')
    expect(badge).toHaveTextContent('5')
  })

  test('Sidebar badge is hidden when unread count is zero', () => {
    mockUseUnreadMessages.mockReturnValue({ count: 0 })
    render(<Sidebar />)
    expect(screen.queryByTestId('nav-badge-messages')).not.toBeInTheDocument()
  })

  test('highlights active route', () => {
    mockUsePathname.mockReturnValue('/plan')
    render(<Sidebar />)
    const planner = screen.getByRole('link', { name: 'Lesson Planner' })
    expect(planner.className).toContain('bg-forest-100')
  })

  test('mobile drawer closes when a link is clicked', () => {
    const onClose = jest.fn()
    render(<Sidebar mobileOpen onClose={onClose} />)
    const drawer = screen.getByTestId('sidebar-mobile-drawer')
    fireEvent.click(within(drawer).getByRole('link', { name: 'Courses' }))
    expect(onClose).toHaveBeenCalled()
  })

  test('mobile overlay closes drawer on backdrop click', () => {
    const onClose = jest.fn()
    render(<Sidebar mobileOpen onClose={onClose} />)
    fireEvent.click(screen.getByTestId('sidebar-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })

  test('highlights People when pathname is /people', () => {
    mockUsePathname.mockReturnValue('/people')
    render(<Sidebar />)
    const people = screen.getByRole('link', { name: 'People' })
    expect(people).toHaveAttribute('href', '/people')
    expect(people.className).toContain('bg-forest-100')
  })
})

describe('Sidebar — module grouping headings', () => {
  test('sidebar renders module group headings in main nav', () => {
    render(<Sidebar />)
    expect(screen.getByText('Planbook')).toBeInTheDocument()
    expect(screen.getByText('Records')).toBeInTheDocument()
    // Settings heading: multiple "Settings" exist (heading + footer link); verify at least 2
    expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(2)
  })

  test('Home module does not get a redundant heading since the single item is named Home', () => {
    render(<Sidebar />)
    const homeTexts = screen.getAllByText('Home')
    // Only the nav link itself — no separate heading element
    expect(homeTexts).toHaveLength(1)
  })

  test('Compliance module does not get a redundant heading since the single item is named Compliance', () => {
    render(<Sidebar />)
    const complianceTexts = screen.getAllByText('Compliance')
    expect(complianceTexts).toHaveLength(1)
  })

  test('all existing main nav items are still rendered', () => {
    render(<Sidebar />)
    expect(screen.getByRole('link', { name: /lesson planner/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /attendance/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /reports & records/i })).toBeInTheDocument()
  })
})
