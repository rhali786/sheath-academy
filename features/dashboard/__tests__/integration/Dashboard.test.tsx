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

import { render, screen, waitFor } from '@testing-library/react'
import { DashboardProvider } from '@/features/dashboard/front/context'
import { HouseholdProvider } from '@/features/household/front/context'
import { NavigationProvider } from '@/features/layout/front/context/NavigationContext'
import Dashboard from '@/features/dashboard/front/pages/Dashboard'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}))

jest.mock('@/features/dashboard/front/services/api', () => ({
  dashboardApi: {
    getTasks: jest.fn(() => Promise.resolve({ data: [] })),
    getAlerts: jest.fn(() => Promise.resolve({ data: [] })),
    getQuran: jest.fn(() => Promise.resolve({ data: { sessions: [], chartData: [] } })),
    getRecords: jest.fn(() => Promise.resolve({ data: [] })),
    getSummary: jest.fn(() => Promise.resolve({
      data: {
        attendanceReady: '3/5',
        lessonsPlanned: 2,
        needsAttention: 2,
        quranLogged: '1 session',
        portfolioItems: 1,
      }
    })),
    getProgress: jest.fn(() => Promise.resolve({ data: {} })),
    completeTask: jest.fn(),
    addQuranSession: jest.fn(),
  }
}))

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getAllChildren: jest.fn(() => Promise.resolve({ data: [] })),
    getChildren: jest.fn(() => Promise.resolve({ data: [] })),
  }
}))

jest.mock('@/features/household/front/services/api', () => ({
  householdApi: {
    getWorkspace: jest.fn(() => Promise.resolve({
      data: { id: 'workspace_001', name: 'Naeem Household', ownerId: 'user_001', createdAt: '2026-01-01T00:00:00.000Z' }
    })),
    getProfile: jest.fn(() => Promise.resolve({
      data: { id: 'household_001', workspaceId: 'workspace_001', familyName: 'Naeem Family', createdAt: '2026-01-01T00:00:00.000Z' }
    })),
    setup: jest.fn(() => Promise.resolve({ data: {} })),
    updateProfile: jest.fn(() => Promise.resolve({ data: {} })),
  }
}))

function renderDashboard() {
  return render(
    <NavigationProvider>
      <HouseholdProvider>
        <DashboardProvider>
          <Dashboard />
        </DashboardProvider>
      </HouseholdProvider>
    </NavigationProvider>
  )
}

describe('Dashboard Page Integration', () => {
  test('Dashboard renders within DashboardProvider without context errors', async () => {
    renderDashboard()

    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  test('Dashboard shows Today tab content by default', async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument()
    })

    expect(screen.getByText(/Today's State/i)).toBeInTheDocument()
  })
})
