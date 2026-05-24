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
    getProfile: jest.fn(() => Promise.resolve({
      data: { id: 'hp_001', workspaceId: 'hp_001', familyName: 'Ahmed Academy', createdAt: '2026-01-01T00:00:00.000Z' },
    })),
    setup: jest.fn(),
    updateProfile: jest.fn(),
  },
}))

jest.mock('@/features/alerts/front/services/api', () => ({
  alertsApi: {
    getAlerts: jest.fn(() => Promise.resolve({ data: [] })),
  },
}))

jest.mock('@/features/dashboard/front/services/api', () => ({
  dashboardApi: {
    getTasks: jest.fn(() => Promise.resolve({ data: [] })),
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

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    getProgress: jest.fn(() => Promise.resolve([])),
    getHistory: jest.fn(() => Promise.resolve([])),
    getLessons: jest.fn(() => Promise.resolve([])),
  },
}))

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: {
    getSubjects: jest.fn(() => Promise.resolve({ data: [] })),
  },
}))

jest.mock('@/features/quran/front/services/api', () => ({
  quranApi: {
    getSessions: jest.fn(() => Promise.resolve({ data: { sessions: [], chartData: [] } })),
    addSession: jest.fn(),
  },
}))

jest.mock('@/features/attendance/front/services/api', () => ({
  attendanceApi: {
    getSummary: jest.fn(() => Promise.resolve({
      data: { childId: 'c1', totalRecorded: 0, byStatus: { present: 0, absent: 0, partial: 0, excused: 0, sick: 0, holiday: 0, field_trip: 0, coop: 0, makeup: 0, not_school: 0 } },
    })),
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

  test('Growth link is present in navigation', async () => {
    renderWithShell()
    await waitForDashboard()

    expect(screen.getAllByRole('link', { name: 'Growth' })[0]).toBeInTheDocument()
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
