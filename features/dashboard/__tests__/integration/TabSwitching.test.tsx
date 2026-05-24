/**
 * Sidebar + Dashboard shell integration — replaces Today tab NavigationContext tests.
 */

import { render, screen, waitFor } from '@testing-library/react'
import { HouseholdProvider } from '@/features/household/front/context'
import { DashboardProvider } from '@/features/dashboard/front/context'
import { Sidebar } from '@/features/layout/front/components/Sidebar'
import Dashboard from '@/features/dashboard/front/pages/Dashboard'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
  signOut: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { name: 'Aisha Parent', email: 'aisha@example.com' } },
    status: 'authenticated',
  })),
}))

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}))

jest.mock('@/features/dashboard/front/components/SchoolYearProgressCard', () => ({
  SchoolYearProgressCard: () => <div data-testid="school-year-progress-card" />,
}))

jest.mock('@/features/schedule/front/components/ScheduleNowNextCard', () => ({
  ScheduleNowNextCard: () => <div data-testid="schedule-now-next-card" />,
}))

jest.mock('@/features/alerts/front/services/api', () => ({
  alertsApi: {
    getAlerts: jest.fn(() => Promise.resolve({ data: [] })),
  },
}))

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    getProgress: jest.fn(() => Promise.resolve([])),
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

jest.mock('@/features/dashboard/front/services/api', () => ({
  dashboardApi: {
    getQuran: jest.fn(() => Promise.resolve({ data: { sessions: [], chartData: [] } })),
    getRecords: jest.fn(() => Promise.resolve({ data: [] })),
    getSummary: jest.fn(() => Promise.resolve({
      data: {
        attendanceReady: '3/5',
        lessonsPlanned: 2,
        needsAttention: 2,
        quranLogged: '1 session',
        portfolioItems: 1,
        tasksCompleted: 2,
        tasksInProgress: 0,
        tasksOverdue: 1,
      },
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

jest.mock('@/features/household/front/services/api', () => ({
  householdApi: {
    getProfile: jest.fn(() => Promise.resolve({
      data: {
        id: 'household_001',
        workspaceId: 'household_001',
        familyName: 'Naeem Family',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    })),
    setup: jest.fn(() => Promise.resolve({ data: {} })),
    updateProfile: jest.fn(() => Promise.resolve({ data: {} })),
  },
}))

function renderWithShell() {
  return render(
    <HouseholdProvider>
      <Sidebar />
      <DashboardProvider>
        <Dashboard />
      </DashboardProvider>
    </HouseholdProvider>
  )
}

async function waitForDashboard() {
  await waitFor(() => {
    expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument()
  }, { timeout: 3000 })
}

describe('Sidebar + Dashboard shell', () => {
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

  test('Grades & Progress link is present in sidebar', async () => {
    renderWithShell()
    await waitForDashboard()
    expect(screen.getByRole('link', { name: 'Grades & Progress' })).toHaveAttribute('href', '/growth')
  })

  test('Settings link is present in sidebar footer', async () => {
    renderWithShell()
    await waitForDashboard()
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings')
  })

  test('dashboard content renders on home route', async () => {
    renderWithShell()
    await waitForDashboard()
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument()
  })
})
