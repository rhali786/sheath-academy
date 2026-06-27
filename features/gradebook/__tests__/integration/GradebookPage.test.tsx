import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { GradebookPage } from '@/features/gradebook/front/pages/GradebookPage'

jest.mock('@/features/gradebook/front/services/api', () => ({
  gradebookApi: {
    getSummaries: jest.fn(),
    getNeedsAttention: jest.fn(),
  },
}))

jest.mock('@/features/layout/front/context/LearnerContext', () => ({
  useLearner: jest.fn(),
}))

import { gradebookApi } from '@/features/gradebook/front/services/api'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import { mockGradebookSummaries } from '@/features/gradebook/__tests__/fixtures/mockGradebook'

const mockGetSummaries = gradebookApi.getSummaries as jest.Mock
const mockGetNeedsAttention = gradebookApi.getNeedsAttention as jest.Mock
const mockUseLearner = useLearner as jest.Mock

function ok<T>(data: T) {
  return Promise.resolve({ status: 'success', data, message: 'ok', timestamp: '' })
}

describe('GradebookPage', () => {
  beforeEach(() => {
    mockUseLearner.mockImplementation(() => ({ selectedChildId: null, setSelectedChildId: jest.fn() }))
    mockGetSummaries.mockImplementation(() => ok(mockGradebookSummaries))
    mockGetNeedsAttention.mockImplementation(() => ok([]))
  })

  afterEach(() => {
    mockUseLearner.mockReset()
    mockGetSummaries.mockReset()
    mockGetNeedsAttention.mockReset()
  })

  it('shows loading state initially', () => {
    mockGetSummaries.mockImplementation(() => new Promise(() => {}))
    render(<GradebookPage />)
    expect(screen.getByTestId('gradebook-loading')).toBeInTheDocument()
  })

  it('shows populated learner cards after load', async () => {
    render(<GradebookPage />)
    await waitFor(() => {
      expect(screen.getByText('Layth')).toBeInTheDocument()
      expect(screen.getByText('Hawa')).toBeInTheDocument()
    })
  })

  it('shows empty "all caught up" state when no needs-attention items', async () => {
    mockGetSummaries.mockImplementation(() =>
      ok([{ ...mockGradebookSummaries[0], needsAttentionSubjects: [] }])
    )
    render(<GradebookPage />)
    await waitFor(() => {
      expect(screen.getByTestId('gradebook-all-caught-up')).toBeInTheDocument()
    })
  })

  it('shows error state when API fails', async () => {
    mockGetSummaries.mockImplementation(() => Promise.reject(new Error('Network error')))
    render(<GradebookPage />)
    await waitFor(() => {
      expect(screen.getByTestId('gradebook-error')).toBeInTheDocument()
    })
  })

  it('shows needs-attention queue when subjects have missing/decaying scores', async () => {
    render(<GradebookPage />)
    await waitFor(() => {
      // Layth has a Quran subject with null grade → needs attention
      expect(screen.getByTestId('gradebook-needs-attention')).toBeInTheDocument()
    })
  })

  it('renders subject grade pills with letter grades', async () => {
    render(<GradebookPage />)
    await waitFor(() => {
      // Layth Math → A
      expect(screen.getAllByText('A').length).toBeGreaterThan(0)
    })
  })

  it('shows GPA when available', async () => {
    render(<GradebookPage />)
    await waitFor(() => {
      expect(screen.getByText(/4\.0/)).toBeInTheDocument()
    })
  })

  it('shows empty learner card for Talut who has no scores', async () => {
    render(<GradebookPage />)
    await waitFor(() => {
      expect(screen.getByText('Talut')).toBeInTheDocument()
      expect(screen.getByTestId('learner-empty-talut')).toBeInTheDocument()
    })
  })
})
