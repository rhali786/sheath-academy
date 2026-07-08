import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { LearningTimeWeekCard } from '@/features/dashboard/front/components/LearningTimeWeekCard'

jest.mock('@/features/learning-time/front/services/api', () => ({
  learningTimeApi: {
    list: jest.fn(),
  },
}))

import { learningTimeApi } from '@/features/learning-time/front/services/api'

const mockList = learningTimeApi.list as jest.Mock

function neverResolves() {
  return new Promise(() => {})
}

function session(id: string, endedAt: string, elapsedSeconds: number) {
  return {
    id,
    householdId: 'hh_1',
    learnerId: 'c1',
    subjectId: null,
    lessonTaskId: null,
    timeChannelType: 'stopwatch' as const,
    targetMinutes: null,
    scheduledStart: null,
    scheduledEnd: null,
    status: 'finalized' as const,
    startedAt: endedAt,
    pausedAt: null,
    endedAt,
    endedBy: 'manual' as const,
    outcome: 'complete' as const,
    notes: null,
    createdAt: endedAt,
    updatedAt: endedAt,
    elapsedSeconds,
  }
}

beforeEach(() => {
  mockList.mockReset()
})

describe('LearningTimeWeekCard', () => {
  it('shows a loading skeleton while fetching', () => {
    mockList.mockReturnValue(neverResolves())
    render(<LearningTimeWeekCard />)
    expect(screen.getByTestId('learning-time-week-card-loading')).toBeInTheDocument()
  })

  it('shows an empty-week state when there are no sessions', async () => {
    mockList.mockResolvedValue({ data: [] })
    render(<LearningTimeWeekCard />)
    await waitFor(() => {
      expect(screen.getByTestId('learning-time-week-card-empty')).toBeInTheDocument()
    })
  })

  it('buckets sessions into weekday bars and totals the footer', async () => {
    // 2026-07-08 is a Wednesday
    mockList.mockResolvedValue({
      data: [
        session('s1', '2026-07-06T10:00:00.000Z', 3600), // Monday, 1h
        session('s2', '2026-07-07T10:00:00.000Z', 1800), // Tuesday, 30m
      ],
    })
    render(<LearningTimeWeekCard />)

    await waitFor(() => {
      expect(screen.getByTestId('learning-time-week-card')).toBeInTheDocument()
    })

    expect(screen.getByTestId('learning-time-bar-Mon')).toBeInTheDocument()
    expect(screen.getByTestId('learning-time-week-card')).toHaveTextContent('1h 30m')
  })
})
