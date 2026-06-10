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

  test('renders module icons for main nav modules', () => {
    render(<Sidebar />)
    expect(screen.getByTestId('nav-module-icon-home')).toBeInTheDocument()
    expect(screen.getByTestId('nav-module-icon-planbook')).toBeInTheDocument()
    expect(screen.getByTestId('nav-module-icon-messages')).toBeInTheDocument()
    expect(screen.getByTestId('nav-icon-settings')).toBeInTheDocument()
  })

  test('renders Hijri date under logo', () => {
    render(<Sidebar />)
    expect(screen.getByTestId('sidebar-hijri-date')).toBeInTheDocument()
  })

  test('renders main module header links', () => {
    render(<Sidebar />)
    expect(screen.getByTestId('nav-module-link-home')).toHaveAttribute('href', '/dashboard')
    expect(screen.getByTestId('nav-module-link-planbook')).toHaveAttribute('href', '/plan/schedule')
    expect(screen.getByTestId('nav-module-link-people')).toHaveAttribute('href', '/people')
    expect(screen.getByTestId('nav-module-link-messages')).toHaveAttribute('href', '/messages')
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
    expect(screen.getByTestId('nav-module-link-home')).toBeInTheDocument()
    expect(screen.queryByTestId('sidebar-collapsed-rail')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('sidebar-collapse-toggle'))
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
    expect(screen.getByTestId('sidebar-collapsed-rail')).toBeInTheDocument()
    expect(screen.getByTestId('nav-module-collapsed-link-home')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('sidebar-collapse-toggle'))
    expect(screen.getByTestId('nav-module-link-home')).toBeInTheDocument()
  })

  test('Finances is not shown in main nav (footer settings module only)', () => {
    render(<Sidebar />)
    expect(screen.queryByRole('link', { name: /finances/i })).not.toBeInTheDocument()
    expect(screen.queryByTestId('nav-disabled-finances')).not.toBeInTheDocument()
  })

  test('Messages module header is a link to /messages', () => {
    render(<Sidebar />)
    const link = screen.getByTestId('nav-module-link-messages')
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

  test('highlights active planbook sub-nav route', () => {
    mockUsePathname.mockReturnValue('/plan')
    render(<Sidebar />)
    const planbook = screen.getByTestId('nav-module-link-planbook')
    expect(planbook.className).toContain('bg-forest-100')
    fireEvent.focus(screen.getByTestId('nav-module-planbook'))
    const planner = within(screen.getByTestId('nav-module-subnav-planbook')).getByTestId('nav-item-lesson-planner')
    expect(planner).toHaveAttribute('aria-current', 'page')
  })

  test('mobile drawer closes when a link is clicked', () => {
    const onClose = jest.fn()
    render(<Sidebar mobileOpen onClose={onClose} />)
    const drawer = screen.getByTestId('sidebar-mobile-drawer')
    fireEvent.click(within(drawer).getByTestId('nav-item-courses'))
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
    const people = screen.getByTestId('nav-module-link-people')
    expect(people).toHaveAttribute('href', '/people')
    expect(people.className).toContain('bg-forest-100')
  })
})

describe('Sidebar — module grouping', () => {
  test('planbook module links to default /plan/schedule when no last destination stored', () => {
    sessionStorage.clear()
    render(<Sidebar />)
    expect(screen.getByTestId('nav-module-link-planbook')).toHaveAttribute('href', '/plan/schedule')
  })

  test('planbook module links to last destination after sub-nav visit', () => {
    sessionStorage.setItem('sheath.module.lastHref.planbook', '/lessons')
    render(<Sidebar />)
    expect(screen.getByTestId('nav-module-link-planbook')).toHaveAttribute('href', '/lessons')
  })

  test('non-active module reveals sub-nav on focus', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    render(<Sidebar />)
    const subNav = screen.getByTestId('nav-module-subnav-planbook')
    expect(subNav.className).toContain('hidden')
    fireEvent.focus(screen.getByTestId('nav-module-planbook'))
    expect(subNav.className).toContain('group-focus-within:block')
  })

  test('sub-nav links carry aria-current when active', () => {
    mockUsePathname.mockReturnValue('/lessons')
    render(<Sidebar />)
    fireEvent.focus(screen.getByTestId('nav-module-planbook'))
    expect(screen.getByTestId('nav-item-courses')).toHaveAttribute('aria-current', 'page')
  })

  test('sidebar renders module header labels', () => {
    render(<Sidebar />)
    expect(screen.getByText('Planbook')).toBeInTheDocument()
    expect(screen.getByText('Records & Compliance')).toBeInTheDocument()
    expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(1)
  })

  test('planbook sub-nav items are reachable on mobile inline layout', () => {
    render(<Sidebar mobileOpen onClose={jest.fn()} />)
    const drawer = screen.getByTestId('sidebar-mobile-drawer')
    expect(within(drawer).getByTestId('nav-item-lesson-planner')).toBeInTheDocument()
    expect(within(drawer).getByTestId('nav-item-courses')).toBeInTheDocument()
    expect(within(drawer).getByTestId('nav-item-attendance')).toBeInTheDocument()
  })
})
