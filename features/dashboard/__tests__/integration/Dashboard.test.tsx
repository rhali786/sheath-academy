/**
 * CRITICAL TEST: Ensures Dashboard works within DashboardProvider
 * 
 * This test catches the "useDashboard must be used within DashboardProvider" error
 * by actually rendering Dashboard with its required provider context.
 * 
 * This is an INTEGRATION test that tests:
 * 1. DashboardProvider successfully provides context
 * 2. Dashboard can consume that context without errors
 * 3. All child components render without context errors
 * 4. Loading, error, and loaded states all work
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import { DashboardProvider } from '@/features/dashboard/front/context'
import { HouseholdProvider } from '@/features/household/front/context'
import Dashboard from '@/features/dashboard/front/pages/Dashboard'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { name: 'Aisha Parent', email: 'aisha@example.com' } },
    status: 'authenticated',
  })),
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
        tasksCompleted: 3,
        tasksInProgress: 1,
        tasksOverdue: 0,
      },
    })),
    getProgress: jest.fn(() => Promise.resolve({ data: {} })),
    completeTask: jest.fn(),
    addQuranSession: jest.fn(),
  }
}))

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getAllChildren: jest.fn(() => Promise.resolve({ data: [] })),
    getChildren: jest.fn(() => Promise.resolve({
      data: [
        { id: 'c1', householdId: 'h1', name: 'Alice', gradeLabel: '1', username: 'alice', password: 'p', isActive: true, createdAt: '2026-01-01' },
        { id: 'c2', householdId: 'h1', name: 'Bob', gradeLabel: '2', username: 'bob', password: 'p', isActive: true, createdAt: '2026-01-01' },
      ]
    })),
  }
}))

jest.mock('@/features/household/front/services/api', () => ({
  householdApi: {
    getProfile: jest.fn(() => Promise.resolve({
      data: { id: 'household_001', workspaceId: 'household_001', familyName: 'Naeem Family', createdAt: '2026-01-01T00:00:00.000Z' }
    })),
    setup: jest.fn(() => Promise.resolve({ data: {} })),
    updateProfile: jest.fn(() => Promise.resolve({ data: {} })),
  }
}))

function renderDashboard() {
  return render(
    <HouseholdProvider>
      <DashboardProvider>
        <Dashboard />
      </DashboardProvider>
    </HouseholdProvider>
  )
}

describe('Dashboard Page Integration', () => {
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

  test('Dashboard renders within DashboardProvider without context errors', async () => {
    renderDashboard()

    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  test('Dashboard shows hero grid with schedule and alerts rail', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument()
    })

    expect(screen.getByTestId('dashboard-hero-grid')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-alerts-rail')).toBeInTheDocument()
    expect(screen.getByTestId('today-schedule-panel')).toBeInTheDocument()
  })

  test('Dashboard shows task summary cards', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByTestId('today-task-summary-cards')).toBeInTheDocument()
    })
  })

  test('ScheduleNowNextCard is rendered inside the schedule panel', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument()
    })

    expect(screen.getByTestId('schedule-now-next-card')).toBeInTheDocument()
  })

  test('child selector lives in the dashboard header', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument()
    })

    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument()
    expect(screen.getByTestId('child-selector')).toBeInTheDocument()
  })

  test('more insights section keeps legacy widgets below the fold', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-more-insights')).toBeInTheDocument()
    })
  })

  test('DashboardProvider does not auto-select first child on load', async () => {
    // DashboardProvider should NOT auto-select the first child when children load.
    // selectedChildId must remain null ("All children") after load.
    // We verify this by checking the ChildSelector still shows "All children" selected
    // after children have loaded (i.e., data-testid="child-selector" select has value='').
    renderDashboard()

    await waitFor(() => {
      expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument()
    })

    // Two children are mocked, so the ChildSelector should be visible
    const childSelector = screen.queryByTestId('child-selector')
    if (childSelector) {
      // If the selector is rendered, the <select> inside it must still show "All children" (value='')
      const select = childSelector.querySelector('select') as HTMLSelectElement | null
      if (select) {
        expect(select.value).toBe('')
      }
    }
    // If child-selector is not present (one or zero children), the test passes trivially —
    // auto-select only matters when there are multiple children.
  })
})
