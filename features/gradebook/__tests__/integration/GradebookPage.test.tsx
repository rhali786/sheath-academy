import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { GradebookPage } from '@/features/gradebook/front/pages/GradebookPage'

jest.mock('@/features/gradebook/front/services/api', () => ({
  gradebookApi: {
    getSummaries: jest.fn(),
    getNeedsAttention: jest.fn(),
    getScores: jest.fn(),
  },
}))

jest.mock('@/features/layout/front/context/LearnerContext', () => ({
  useLearner: jest.fn(),
}))

import { gradebookApi } from '@/features/gradebook/front/services/api'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import { mockGradebookSummaries, mockScores } from '@/features/gradebook/__tests__/fixtures/mockGradebook'

const mockGetSummaries = gradebookApi.getSummaries as jest.Mock
const mockGetNeedsAttention = gradebookApi.getNeedsAttention as jest.Mock
const mockGetScores = gradebookApi.getScores as jest.Mock
const mockUseLearner = useLearner as jest.Mock

function ok<T>(data: T) {
  return Promise.resolve({ status: 'success', data, message: 'ok', timestamp: '' })
}

describe('GradebookPage', () => {
  beforeEach(() => {
    mockUseLearner.mockImplementation(() => ({ selectedChildId: null, setSelectedChildId: jest.fn() }))
    mockGetSummaries.mockImplementation(() => ok(mockGradebookSummaries))
    mockGetNeedsAttention.mockImplementation(() => ok([]))
    mockGetScores.mockImplementation(() => ok([]))
  })

  afterEach(() => {
    mockUseLearner.mockReset()
    mockGetSummaries.mockReset()
    mockGetNeedsAttention.mockReset()
    mockGetScores.mockReset()
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

  it('subject rows are clickable buttons', async () => {
    render(<GradebookPage />)
    await waitFor(() => expect(screen.getByText('Layth')).toBeInTheDocument())
    const mathRow = screen.getByTestId(`subject-row-${mockGradebookSummaries[0].learnerId}-${mockGradebookSummaries[0].subjects[0].subjectId}`)
    expect(mathRow.tagName).toBe('BUTTON')
  })

  it('clicking a subject row fetches and shows score history', async () => {
    const laythScores = mockScores.filter(s => s.learnerId === mockGradebookSummaries[0].learnerId && s.subjectId === mockGradebookSummaries[0].subjects[0].subjectId)
    mockGetScores.mockImplementation(() => ok(laythScores))
    render(<GradebookPage />)
    await waitFor(() => expect(screen.getByText('Layth')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId(`subject-row-${mockGradebookSummaries[0].learnerId}-${mockGradebookSummaries[0].subjects[0].subjectId}`))
    await waitFor(() => {
      expect(screen.getByTestId(`score-history-${mockGradebookSummaries[0].learnerId}-${mockGradebookSummaries[0].subjects[0].subjectId}`)).toBeInTheDocument()
    })
  })

  it('clicking an expanded subject row collapses it', async () => {
    mockGetScores.mockImplementation(() => ok([]))
    render(<GradebookPage />)
    await waitFor(() => expect(screen.getByText('Layth')).toBeInTheDocument())
    const rowId = `subject-row-${mockGradebookSummaries[0].learnerId}-${mockGradebookSummaries[0].subjects[0].subjectId}`
    fireEvent.click(screen.getByTestId(rowId))
    await waitFor(() => expect(screen.getByTestId(`score-history-${mockGradebookSummaries[0].learnerId}-${mockGradebookSummaries[0].subjects[0].subjectId}`)).toBeInTheDocument())
    fireEvent.click(screen.getByTestId(rowId))
    expect(screen.queryByTestId(`score-history-${mockGradebookSummaries[0].learnerId}-${mockGradebookSummaries[0].subjects[0].subjectId}`)).not.toBeInTheDocument()
  })
})
