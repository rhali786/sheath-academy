/**
 * Regression test for tab switching bug.
 *
 * Root cause: moving Header into AppShell severed the tab state connection.
 * AppShell rendered <Header /> with no onTabChange/selectedTab, so clicking
 * tabs called undefined and Dashboard's local selectedTab stayed 'Today'.
 *
 * Fix: NavigationContext owned by AppShell, shared by Header and Dashboard.
 * This test renders Header + Dashboard together under NavigationProvider
 * and asserts that clicking a tab actually changes the visible content.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NavigationProvider } from '@/features/layout/front/context/NavigationContext'
import { HouseholdProvider } from '@/features/household/front/context'
import { DashboardProvider } from '@/features/dashboard/front/context'
import { Header } from '@/features/layout/front/components/Header'
import Dashboard from '@/features/dashboard/front/pages/Dashboard'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
  signOut: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}))

jest.mock('@/features/household/front/services/api', () => ({
  householdApi: {
    getWorkspace: jest.fn(() => Promise.resolve({
      data: { id: 'ws_001', name: 'Ahmed Household', ownerId: 'u1', createdAt: '2026-01-01T00:00:00.000Z' },
    })),
    getProfile: jest.fn(() => Promise.resolve({
      data: { id: 'hp_001', workspaceId: 'ws_001', familyName: 'Ahmed Academy', createdAt: '2026-01-01T00:00:00.000Z' },
    })),
    setup: jest.fn(),
    updateProfile: jest.fn(),
  },
}))

jest.mock('@/features/dashboard/front/services/api', () => ({
  dashboardApi: {
    getTasks: jest.fn(() => Promise.resolve({ data: [] })),
    getAlerts: jest.fn(() => Promise.resolve({ data: [] })),
    getQuran: jest.fn(() => Promise.resolve({ data: { sessions: [], chartData: [] } })),
    getRecords: jest.fn(() => Promise.resolve({ data: [] })),
    getSummary: jest.fn(() => Promise.resolve({
      data: { attendanceReady: '0/5', lessonsPlanned: 0, needsAttention: 0, quranLogged: '0', portfolioItems: 0 },
    })),
    getProgress: jest.fn(() => Promise.resolve({ data: {} })),
    completeTask: jest.fn(),
    addQuranSession: jest.fn(),
  },
}))

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getAllChildren: jest.fn(() => Promise.resolve({ data: [] })),
    getChildren: jest.fn(() => Promise.resolve({ data: [] })),
  },
}))

jest.mock('@/features/planner/front/services/api', () => ({
  plannerApi: {
    getProgress: jest.fn(() => Promise.resolve([])),
    getHistory: jest.fn(() => Promise.resolve([])),
  },
}))

beforeAll(() => {
  // JSDOM: Tailwind `md:` nav uses matchMedia; default viewport hides desktop tabs.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).matchMedia = jest.fn().mockImplementation(() => ({
    matches: true,
    media: '',
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }))
})

function renderWithShell() {
  return render(
    <NavigationProvider>
      <HouseholdProvider>
        <Header />
        <DashboardProvider>
          <Dashboard />
        </DashboardProvider>
      </HouseholdProvider>
    </NavigationProvider>
  )
}

async function waitForDashboard() {
  await waitFor(() => {
    expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument()
  }, { timeout: 3000 })
}

describe('Tab switching — NavigationContext regression', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: { nextStep: null, completed: [] },
        message: '',
        timestamp: new Date().toISOString(),
      }),
    })
  })

  test('Reports tab shows Reports content', async () => {
    renderWithShell()
    await waitForDashboard()

    fireEvent.click(screen.getAllByRole('button', { name: 'Reports' })[0])
    await waitFor(() => {
      expect(screen.getByText(/no lessons planned this week/i)).toBeInTheDocument()
    })
  })

  test('Settings link is present in navigation', async () => {
    renderWithShell()
    await waitForDashboard()

    expect(screen.getAllByRole('link', { name: 'Settings' })[0]).toBeInTheDocument()
  })

  test('Today tab is active by default', async () => {
    renderWithShell()
    await waitForDashboard()

    expect(screen.getByText("Today's State")).toBeInTheDocument()
  })
})
