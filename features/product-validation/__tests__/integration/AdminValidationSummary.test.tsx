import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { AdminValidationSummary } from '@/features/product-validation/front/components/AdminValidationSummary'
import type { ProductValidationSummary } from '@/features/product-validation/types'

const mockSummary: ProductValidationSummary = {
  totalResponses: 1,
  averageForkTestFitScore: 4,
  averagePreviousPainScore: 4,
  averageImprovementScore: 5,
  averageEaseScore: 3,
  averageTrustScore: 4,
  averageRetentionScore: 5,
  averagePayScore: 2,
  averageReferralScore: 4,
  averagePositioningClarityScore: 3,
  priceBucketCounts: {
    '0': 0,
    '5': 0,
    '10': 0,
    '15': 1,
    '20': 0,
    '30': 0,
    '50': 0,
    '75': 0,
    '100_plus': 0,
  },
  mayContactCount: 1,
  mayQuoteAnonymizedCount: 0,
  mayQuoteWithNameCount: 0,
}

describe('AdminValidationSummary', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url: string | URL) => {
      const path = String(url)
      if (path.includes('/summary')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'success',
              data: mockSummary,
              message: 'ok',
              timestamp: new Date().toISOString(),
            }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'success',
            data: [
              {
                id: 'pvr_1',
                userId: 'u1',
                respondentEmail: 'a@b.com',
                respondentType: 'homeschool_family',
                usageDuration: 'one_week',
                usedFeatureAreas: ['dashboard'],
                previousPainScore: 4,
                improvementScore: 5,
                easeScore: 3,
                trustScore: 4,
                retentionScore: 5,
                payScore: 2,
                referralScore: 4,
                positioningClarityScore: 3,
                reasonableMonthlyPriceBucket: '15',
                replacedWhat: 'x',
                mostUseful: 'y',
                confusingOrBurdensome: 'z',
                mustHaveChange: 'a',
                lostAccessReaction: 'b',
                recommendTo: 'c',
                referralMessage: 'd',
                mayContact: true,
                mayQuoteAnonymized: false,
                mayQuoteWithName: false,
                forkTestFitScore: 4,
                createdAt: '2026-05-22T12:00:00.000Z',
                updatedAt: '2026-05-22T12:00:00.000Z',
              },
            ],
            message: 'ok',
            timestamp: new Date().toISOString(),
          }),
      } as Response)
    }) as jest.Mock
  })

  it('renders empty state when no responses', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url: string | URL) => {
      const path = String(url)
      if (path.includes('/summary')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'success',
              data: { ...mockSummary, totalResponses: 0 },
              message: 'ok',
              timestamp: new Date().toISOString(),
            }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'success',
            data: [],
            message: 'ok',
            timestamp: new Date().toISOString(),
          }),
      } as Response)
    })
    render(<AdminValidationSummary />)
    await waitFor(() => {
      expect(screen.getByTestId('admin-validation-empty')).toBeInTheDocument()
    })
  })

  it('renders summary metrics when data exists', async () => {
    render(<AdminValidationSummary />)
    await waitFor(() => {
      expect(screen.getByTestId('admin-validation-section')).toBeInTheDocument()
    })
    expect(screen.getByText(/fork test fit/i)).toBeInTheDocument()
    expect(screen.getByText('Responses').closest('div')?.parentElement).toBeTruthy()
    expect(screen.getAllByText('4.00').length).toBeGreaterThan(0)
  })

  it('shows forbidden message on 403', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(
      Object.assign(new Error('Forbidden'), { status: 403 }),
    )
    render(<AdminValidationSummary />)
    await waitFor(() => {
      expect(screen.getByTestId('admin-validation-forbidden')).toBeInTheDocument()
    })
  })
})
