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

import { usePathname, useSearchParams } from 'next/navigation'

const mockUsePathname = usePathname as jest.Mock
const mockUseSearchParams = useSearchParams as jest.Mock

describe('Sidebar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
    mockUseSearchParams.mockReturnValue(new URLSearchParams())
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
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Lesson Planner' })).toHaveAttribute('href', '/plan')
    expect(screen.getByRole('link', { name: 'Courses' })).toHaveAttribute('href', '/lessons')
    expect(screen.getByRole('link', { name: 'Quran' })).toHaveAttribute('href', '/quran')
  })

  test('renders footer nav links', () => {
    render(<Sidebar />)
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings')
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin/metrics')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
  })

  test('disabled Messages and Finances are not links', () => {
    render(<Sidebar />)
    expect(screen.queryByRole('link', { name: /messages/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /finances/i })).not.toBeInTheDocument()
    expect(screen.getByTestId('nav-disabled-messages')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByTestId('nav-disabled-finances')).toHaveAttribute('aria-disabled', 'true')
  })

  test('Messages shows grayed badge', () => {
    render(<Sidebar />)
    const badge = screen.getByTestId('nav-badge-messages')
    expect(badge).toHaveClass('opacity-40')
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

  test('highlights People when settings tab is children', () => {
    mockUsePathname.mockReturnValue('/settings')
    mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=children'))
    render(<Sidebar />)
    const people = screen.getByRole('link', { name: 'People' })
    expect(people.className).toContain('bg-forest-100')
  })
})
