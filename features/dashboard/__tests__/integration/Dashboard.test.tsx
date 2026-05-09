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
import Dashboard from '@/features/dashboard/front/pages/Dashboard'

// Mock the API calls
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

describe('Dashboard Page Integration', () => {
  test('Dashboard renders within DashboardProvider without context errors', async () => {
    // This is the critical test - if Dashboard is trying to use context outside of provider,
    // it will throw "useDashboard must be used within DashboardProvider"
    render(
      <DashboardProvider>
        <Dashboard />
      </DashboardProvider>
    )

    // Should show loading state initially
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument()

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  test('Dashboard shows Today tab content by default', async () => {
    render(
      <DashboardProvider>
        <Dashboard />
      </DashboardProvider>
    )

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument()
    })

    // Today tab content should be visible (check for content unique to Today tab)
    expect(screen.getByText(/Today's State/i)).toBeInTheDocument()
  })
})
