'use client'

import { render, screen, waitFor } from '@testing-library/react'
import { PortfolioPage } from '@/features/portfolio/front/pages/PortfolioPage'

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(() => ({
    workspace: { id: 'ws_001', name: 'Test', ownerId: 'u', createdAt: '2026-01-01T00:00:00.000Z' },
    householdProfile: { id: 'hh_001', workspaceId: 'ws_001', familyName: 'Test', createdAt: '2026-01-01T00:00:00.000Z' },
    loading: false,
    needsSetup: false,
    familyName: 'Test',
  })),
}))

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getChildren: jest.fn(() =>
      Promise.resolve({
        data: [
          { id: 'c1', name: 'Khadijah', householdId: 'hh_001', gradeLabel: 'Grade 3', username: 'k', password: '', isActive: true, avatarInitials: 'K', createdAt: '2026-01-01T00:00:00.000Z' },
        ],
        status: 'success',
        message: '',
        timestamp: '',
      })
    ),
  },
}))

jest.mock('@/features/portfolio/front/services/api', () => ({
  portfolioApi: {
    listEvidence: jest.fn(() => Promise.resolve({ data: [], status: 'success', message: '', timestamp: '' })),
    createEvidence: jest.fn(),
  },
}))

global.fetch = jest.fn(() =>
  Promise.resolve({ ok: true, json: async () => ({ data: [], status: 'success', message: '', timestamp: '' }) })
) as jest.Mock

describe('PortfolioPage — standalone (no DashboardProvider)', () => {
  test('renders without DashboardProvider', () => {
    expect(() => render(<PortfolioPage />)).not.toThrow()
  })

  test('shows Portfolio heading', async () => {
    render(<PortfolioPage />)
    await waitFor(() => expect(screen.getByRole('heading', { name: /portfolio/i })).toBeInTheDocument())
  })

  test('shows empty evidence state when no items exist', async () => {
    render(<PortfolioPage />)
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(), { timeout: 2000 })
    expect(screen.getByRole('heading', { name: /portfolio/i })).toBeInTheDocument()
  })
})
