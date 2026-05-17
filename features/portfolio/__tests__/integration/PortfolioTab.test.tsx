import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { PortfolioTab } from '@/features/portfolio/front/components/PortfolioTab'

jest.mock('@/features/dashboard/front/context', () => ({
  useContext_Dashboard: jest.fn(() => ({
    children: [{ id: 'child_001', name: 'Adam', gradeLabel: '5th', householdId: 'hh_001', isActive: true, username: 'adam', password: 'pw', createdAt: '' }],
    selectedChildId: 'child_001',
  })),
}))

jest.mock('@/features/portfolio/front/services/api', () => ({
  portfolioApi: {
    listEvidence: jest.fn().mockResolvedValue({ status: 'success', data: [], message: '', timestamp: '' }),
    createEvidence: jest.fn(),
  },
}))

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ status: 'success', data: [] }),
})

describe('PortfolioTab', () => {
  it('wraps content in a max-w-7xl container', async () => {
    const { container } = render(<PortfolioTab />)
    await waitFor(() => {
      const outer = container.firstChild as HTMLElement
      expect(outer.className).toMatch(/max-w-7xl/)
    })
  })
})
