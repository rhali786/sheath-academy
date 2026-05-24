import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { ProgressBySubjectCard } from '@/features/plan/front/components/ProgressBySubjectCard'
import type { SubjectProgressSummary } from '@/features/plan/utils/progressBySubject'

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    getProgress: jest.fn(),
  },
}))

import { plannerApi } from '@/features/plan/front/services/api'
const mockGetProgress = plannerApi.getProgress as jest.Mock

const mockSummaries: SubjectProgressSummary[] = [
  {
    childId: 'child_a',
    childName: 'Adam',
    subjectId: 'subj_math',
    subjectName: 'Math',
    scope: 'week',
    plannedCount: 3,
    completedCount: 2,
    pendingCount: 1,
    completionRate: 2 / 3,
  },
  {
    childId: 'child_a',
    childName: 'Adam',
    subjectId: 'subj_quran',
    subjectName: 'Quran',
    scope: 'week',
    plannedCount: 2,
    completedCount: 2,
    pendingCount: 0,
    completionRate: 1,
  },
]

describe('ProgressBySubjectCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading state initially', () => {
    mockGetProgress.mockReturnValue(new Promise(() => {}))
    render(<ProgressBySubjectCard scope="week" dateRange={{ start: '2026-05-11', end: '2026-05-17' }} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders subject progress rows after loading', async () => {
    mockGetProgress.mockResolvedValue(mockSummaries)
    render(<ProgressBySubjectCard scope="week" dateRange={{ start: '2026-05-11', end: '2026-05-17' }} />)
    await waitFor(() => {
      expect(screen.getByText('Math')).toBeInTheDocument()
      expect(screen.getByText('Quran')).toBeInTheDocument()
    })
  })

  it('shows empty state when no summaries returned', async () => {
    mockGetProgress.mockResolvedValue([])
    render(<ProgressBySubjectCard scope="week" dateRange={{ start: '2026-05-11', end: '2026-05-17' }} />)
    await waitFor(() => {
      expect(screen.getByText(/no lessons/i)).toBeInTheDocument()
    })
  })

  it('shows error state when fetch fails', async () => {
    mockGetProgress.mockRejectedValue(new Error('Network error'))
    render(<ProgressBySubjectCard scope="week" dateRange={{ start: '2026-05-11', end: '2026-05-17' }} />)
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })
  })

  it('displays planned, completed, and pending counts', async () => {
    mockGetProgress.mockResolvedValue(mockSummaries)
    render(<ProgressBySubjectCard scope="week" dateRange={{ start: '2026-05-11', end: '2026-05-17' }} />)
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument() // plannedCount for Math
      expect(screen.getAllByText('2').length).toBeGreaterThan(0) // completedCount
    })
  })

  it('displays child names as group headings', async () => {
    mockGetProgress.mockResolvedValue(mockSummaries)
    render(<ProgressBySubjectCard scope="week" dateRange={{ start: '2026-05-11', end: '2026-05-17' }} />)
    await waitFor(() => {
      expect(screen.getByText('Adam')).toBeInTheDocument()
    })
  })

  it('passes scope and dateRange to the API call', async () => {
    mockGetProgress.mockResolvedValue([])
    render(<ProgressBySubjectCard scope="year" dateRange={{ start: '2025-08-01', end: '2026-05-31' }} />)
    await waitFor(() => {
      expect(mockGetProgress).toHaveBeenCalledWith(
        'year',
        expect.objectContaining({ start: '2025-08-01', end: '2026-05-31' }),
        undefined
      )
    })
  })
})
