import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { LearningTimeEntry } from '@/features/dashboard/front/components/LearningTimeEntry'
import type { ApiResponse } from '@/features/lib/types'
import type { LearningTimeSession } from '@/features/learning-time/types'

jest.mock('@/features/learning-time/front/services/api', () => ({
  learningTimeApi: {
    getActive: jest.fn(),
  },
}))

import { learningTimeApi } from '@/features/learning-time/front/services/api'

const mockGetActive = learningTimeApi.getActive as jest.Mock

function ok<T>(data: T): ApiResponse<T> {
  return { status: 'success', data, message: '', timestamp: '' }
}

const activeSession: LearningTimeSession = {
  id: 'session_001',
  householdId: 'hh_001',
  learnerId: 'child_001',
  subjectId: null,
  lessonTaskId: null,
  timeChannelType: 'stopwatch',
  targetMinutes: null,
  scheduledStart: null,
  scheduledEnd: null,
  status: 'running',
  startedAt: '2026-06-12T10:00:00.000Z',
  pausedAt: null,
  endedAt: null,
  endedBy: null,
  outcome: null,
  notes: null,
  createdAt: '2026-06-12T10:00:00.000Z',
  updatedAt: '2026-06-12T10:00:00.000Z',
  elapsedSeconds: 125,
}

describe('LearningTimeEntry', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders a "Start Learning Time" link to /learning-time when there is no active session', async () => {
    mockGetActive.mockResolvedValue(ok<LearningTimeSession | null>(null))

    render(<LearningTimeEntry learnerId="child_001" learnerName="Adam" />)

    await waitFor(() => {
      expect(screen.getByTestId('learning-time-link')).toHaveTextContent('Start Learning Time')
    })
    expect(screen.getByTestId('learning-time-link')).toHaveAttribute('href', '/learning-time')
  })

  it('renders a "Resume session" variant when an active session exists', async () => {
    mockGetActive.mockResolvedValue(ok<LearningTimeSession | null>(activeSession))

    render(<LearningTimeEntry learnerId="child_001" learnerName="Adam" />)

    await waitFor(() => {
      expect(screen.getByTestId('learning-time-link')).toHaveTextContent('Resume session — Adam, 02:05')
    })
    expect(screen.getByTestId('learning-time-link')).toHaveAttribute('href', '/learning-time')
  })

  it('renders the default link when no learner is selected', async () => {
    render(<LearningTimeEntry learnerId={null} />)

    await waitFor(() => {
      expect(screen.getByTestId('learning-time-link')).toHaveTextContent('Start Learning Time')
    })
    expect(mockGetActive).not.toHaveBeenCalled()
  })
})
