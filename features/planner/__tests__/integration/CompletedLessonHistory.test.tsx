import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { CompletedLessonHistory } from '@/features/planner/front/components/CompletedLessonHistory'
import type { LessonTask } from '@/features/planner/types'

jest.mock('@/features/planner/front/services/api', () => ({
  plannerApi: {
    getHistory: jest.fn(),
  },
}))

import { plannerApi } from '@/features/planner/front/services/api'
const mockGetHistory = plannerApi.getHistory as jest.Mock

function makeLesson(overrides: Partial<LessonTask> = {}): LessonTask {
  return {
    id: 'l1',
    childId: 'child_a',
    subjectId: 'subj_math',
    householdId: 'hh_1',
    title: 'Math Lesson',
    dueDate: '2026-05-12',
    status: 'completed' as const,
    order: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('CompletedLessonHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading state initially', () => {
    mockGetHistory.mockReturnValue(new Promise(() => {}))
    render(<CompletedLessonHistory />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders lesson titles after loading', async () => {
    mockGetHistory.mockResolvedValue([makeLesson({ title: 'Math Lesson' })])
    render(<CompletedLessonHistory />)
    await waitFor(() => {
      expect(screen.getByText('Math Lesson')).toBeInTheDocument()
    })
  })

  it('shows empty state when no history', async () => {
    mockGetHistory.mockResolvedValue([])
    render(<CompletedLessonHistory />)
    await waitFor(() => {
      expect(screen.getByText(/no completed lessons/i)).toBeInTheDocument()
    })
  })

  it('shows error state when fetch fails', async () => {
    mockGetHistory.mockRejectedValue(new Error('Network error'))
    render(<CompletedLessonHistory />)
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })
  })

  it('renders multiple lessons in order', async () => {
    const lessons = [
      makeLesson({ id: 'l1', title: 'First Lesson', dueDate: '2026-05-14' }),
      makeLesson({ id: 'l2', title: 'Second Lesson', dueDate: '2026-05-12' }),
    ]
    mockGetHistory.mockResolvedValue(lessons)
    render(<CompletedLessonHistory />)
    await waitFor(() => {
      const items = screen.getAllByRole('listitem')
      expect(items[0]).toHaveTextContent('First Lesson')
      expect(items[1]).toHaveTextContent('Second Lesson')
    })
  })

  it('displays due date for each lesson', async () => {
    mockGetHistory.mockResolvedValue([makeLesson({ dueDate: '2026-05-12' })])
    render(<CompletedLessonHistory />)
    await waitFor(() => {
      expect(screen.getByText(/2026-05-12/)).toBeInTheDocument()
    })
  })

  it('passes childId filter to API when provided', async () => {
    mockGetHistory.mockResolvedValue([])
    render(<CompletedLessonHistory childId="child_a" />)
    await waitFor(() => {
      expect(mockGetHistory).toHaveBeenCalledWith(
        expect.objectContaining({ childId: 'child_a' })
      )
    })
  })

  it('passes limit to API when provided', async () => {
    mockGetHistory.mockResolvedValue([])
    render(<CompletedLessonHistory limit={5} />)
    await waitFor(() => {
      expect(mockGetHistory).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5 })
      )
    })
  })
})
