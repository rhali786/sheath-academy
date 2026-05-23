import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '@/features/layout/front/components/Header'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(() => ({
    familyName: '',
    householdProfile: null,
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
import { usePathname, useRouter } from 'next/navigation'
import { useHousehold } from '@/features/household/front/context'
import { useNavigation } from '@/features/layout/front/context/NavigationContext'
const mockUseSession = useSession as jest.Mock
const mockSignOut = signOut as jest.Mock
const mockUsePathname = usePathname as jest.Mock
const mockUseRouter = useRouter as jest.Mock
const mockUseHousehold = useHousehold as jest.Mock
const mockUseNavigation = useNavigation as jest.Mock

const defaultHousehold = () => ({
  familyName: '',
  householdProfile: null,
  needsSetup: false,
  loading: false,
  error: null,
  refetch: jest.fn(),
})

const defaultNavigation = () => ({
  selectedTab: 'Today',
  setSelectedTab: jest.fn(),
})

afterEach(() => {
  mockUseHousehold.mockImplementation(defaultHousehold)
  mockUseNavigation.mockImplementation(defaultNavigation)
  mockUseRouter.mockImplementation(() => ({ push: jest.fn() }))
})

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
    mockUseHousehold.mockImplementation(() => ({
      ...defaultHousehold(),
      familyName: 'Ahmed Academy',
    }))
    render(<Header />)
    expect(screen.getByText('Ahmed Academy')).toBeInTheDocument()
    expect(screen.queryByText('Home Education')).not.toBeInTheDocument()
  })
})

describe('Header — tab navigation on dashboard page', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    mockUsePathname.mockReturnValue('/')
  })

  test('renders dashboard tab buttons and nav links on desktop', () => {
    render(<Header />)
    expect(screen.getAllByRole('button', { name: 'Today' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Growth' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Records' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Plan' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Resources' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Settings' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'About' }).length).toBeGreaterThan(0)
  })

  test('active tab has distinct active styling', () => {
    mockUseNavigation.mockImplementation(() => ({
      ...defaultNavigation(),
      selectedTab: 'Today',
    }))
    render(<Header />)
    const todayButtons = screen.getAllByRole('button', { name: 'Today' })
    expect(todayButtons.some((b) => b.className.includes('bg-forest-900'))).toBe(true)
  })

  test('clicking Today tab calls setSelectedTab and does NOT push router when already on /', () => {
    const setSelectedTab = jest.fn()
    const push = jest.fn()
    mockUseNavigation.mockImplementation(() => ({
      ...defaultNavigation(),
      setSelectedTab,
    }))
    mockUseRouter.mockImplementation(() => ({ push }))
    render(<Header />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Today' })[0])
    expect(setSelectedTab).toHaveBeenCalledWith('Today')
    expect(push).not.toHaveBeenCalled()
  })

  test('Growth link points to /growth', () => {
    render(<Header />)
    const growthLinks = screen.getAllByRole('link', { name: 'Growth' })
    expect(growthLinks.length).toBeGreaterThan(0)
    growthLinks.forEach(link => {
      expect(link).toHaveAttribute('href', '/growth')
    })
  })
})

describe('Header — tab navigation from non-dashboard page', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    mockUsePathname.mockReturnValue('/about')
  })

  test('clicking Today tab from /about calls setSelectedTab AND navigates to /', () => {
    const setSelectedTab = jest.fn()
    const push = jest.fn()
    mockUseNavigation.mockImplementation(() => ({
      ...defaultNavigation(),
      setSelectedTab,
    }))
    mockUseRouter.mockImplementation(() => ({ push }))
    render(<Header />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Today' })[0])
    expect(setSelectedTab).toHaveBeenCalledWith('Today')
    expect(push).toHaveBeenCalledWith('/')
  })

  test('Records link points to the standalone /records page', () => {
    render(<Header />)
    const recordsLinks = screen.getAllByRole('link', { name: 'Records' })
    expect(recordsLinks.length).toBeGreaterThan(0)
    recordsLinks.forEach(link => {
      expect(link).toHaveAttribute('href', '/records')
    })
  })

  test('About link is highlighted when on /about', () => {
    render(<Header />)
    const aboutLink = screen.getByRole('link', { name: 'About' })
    expect(aboutLink.className).toContain('bg-forest-900')
  })

  test('dashboard tabs are NOT highlighted when on /about', () => {
    render(<Header />)
    const todayButton = screen.getAllByRole('button', { name: 'Today' })[0]
    expect(todayButton.className).not.toContain('bg-forest-900')
  })
})

describe('Header — Plan nav link', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    mockUsePathname.mockReturnValue('/')
  })

  test('renders "Plan" nav link and navigates to /plan on click', () => {
    render(<Header />)
    const planLinks = screen.getAllByRole('link', { name: 'Plan' })
    expect(planLinks.length).toBeGreaterThan(0)
    planLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/plan')
    })
  })

  test('Plan link is highlighted when on /plan', () => {
    mockUsePathname.mockReturnValue('/plan')
    render(<Header />)
    const planLink = screen.getAllByRole('link', { name: 'Plan' })[0]
    expect(planLink.className).toContain('bg-forest-900')
  })

  test('Plan link is not highlighted when on dashboard', () => {
    mockUsePathname.mockReturnValue('/')
    render(<Header />)
    const planLink = screen.getAllByRole('link', { name: 'Plan' })[0]
    expect(planLink.className).not.toContain('bg-forest-900')
  })

  test('Resources link points to /resources', () => {
    render(<Header />)
    const resourcesLinks = screen.getAllByRole('link', { name: 'Resources' })
    expect(resourcesLinks.length).toBeGreaterThan(0)
    resourcesLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/resources')
    })
  })

  test('Growth link points to /growth', () => {
    render(<Header />)
    const growthLinks = screen.getAllByRole('link', { name: 'Growth' })
    expect(growthLinks.length).toBeGreaterThan(0)
    growthLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/growth')
    })
  })
})

describe('Header — Lessons nav link', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    mockUsePathname.mockReturnValue('/')
  })

  test('Desktop: Lessons link points to /lessons', () => {
    render(<Header />)
    const lessonsLinks = screen.getAllByRole('link', { name: 'Lessons' })
    expect(lessonsLinks.length).toBeGreaterThan(0)
    lessonsLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/lessons')
    })
  })

  test('Mobile: menu includes Lessons link', () => {
    mockUsePathname.mockReturnValue('/')
    render(<Header />)
    // Open the mobile menu
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    const lessonsLinks = screen.getAllByRole('link', { name: 'Lessons' })
    expect(lessonsLinks.length).toBeGreaterThan(0)
  })

  test('Mobile: clicking Lessons closes the menu', () => {
    render(<Header />)
    // Open the mobile menu
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument()

    // Click lessons link (mobile one is a Link with onClick to close)
    const allLessonsLinks = screen.getAllByRole('link', { name: 'Lessons' })
    // Find the one inside the mobile menu (last one, or trigger a click)
    fireEvent.click(allLessonsLinks[allLessonsLinks.length - 1])
    // Menu should be closed — hamburger should say "Open menu"
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
  })
})
