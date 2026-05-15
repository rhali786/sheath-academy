import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { TodayLessonCard } from '@/features/planner/front/components/TodayLessonCard'
import type { LessonTask } from '@/features/planner/types'

jest.mock('@/features/planner/front/services/api', () => ({
  plannerApi: {
    getLessons: jest.fn(),
  },
}))

import { plannerApi } from '@/features/planner/front/services/api'
const mockGetLessons = plannerApi.getLessons as jest.Mock

const makeLessons = (overrides: Partial<LessonTask>[] = []): LessonTask[] =>
  overrides.map((o, i) => ({
    id: `lesson_${i}`,
    childId: 'child_001',
    subjectId: 'subj_001',
    householdId: 'hh_001',
    title: `Lesson ${i}`,
    dueDate: '2026-05-12',
    status: 'not_started' as const,
    order: i,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...o,
  }))

beforeEach(() => {
  mockGetLessons.mockReset()
})

describe('TodayLessonCard', () => {
  it('shows loading skeleton while fetching', () => {
    mockGetLessons.mockReturnValue(new Promise(() => {})) // never resolves
    render(<TodayLessonCard childId="child_001" today="2026-05-12" />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    mockGetLessons.mockRejectedValue(new Error('network error'))
    render(<TodayLessonCard childId="child_001" today="2026-05-12" />)
    await waitFor(() => {
      expect(screen.getByText(/could not load today's lessons/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no lessons today', async () => {
    // Return lessons for different dates
    mockGetLessons.mockResolvedValue(makeLessons([{ dueDate: '2026-05-11' }]))
    render(<TodayLessonCard childId="child_001" today="2026-05-12" />)
    await waitFor(() => {
      expect(screen.getByText(/no lessons scheduled for today/i)).toBeInTheDocument()
    })
  })

  it('shows only lessons for today, not other dates', async () => {
    mockGetLessons.mockResolvedValue(makeLessons([
      { title: 'Today lesson', dueDate: '2026-05-12' },
      { title: 'Other day lesson', dueDate: '2026-05-13' },
    ]))
    render(<TodayLessonCard childId="child_001" today="2026-05-12" />)
    await waitFor(() => {
      expect(screen.getByText('Today lesson')).toBeInTheDocument()
      expect(screen.queryByText('Other day lesson')).not.toBeInTheDocument()
    })
  })

  it('completed lessons are faded with strikethrough and Done badge', async () => {
    mockGetLessons.mockResolvedValue(makeLessons([
      { title: 'Completed task', dueDate: '2026-05-12', status: 'completed' },
    ]))
    render(<TodayLessonCard childId="child_001" today="2026-05-12" />)
    await waitFor(() => {
      expect(screen.getByText('Completed task')).toBeInTheDocument()
      // Badge text is exactly "Done"
      expect(screen.getByText('Done')).toBeInTheDocument()
    })
  })

  it('skipped lessons show Skipped label and are faded', async () => {
    mockGetLessons.mockResolvedValue(makeLessons([
      { title: 'Missed task', dueDate: '2026-05-12', status: 'skipped' },
    ]))
    render(<TodayLessonCard childId="child_001" today="2026-05-12" />)
    await waitFor(() => {
      expect(screen.getByText('Missed task')).toBeInTheDocument()
      // Badge text is exactly "Skipped"
      expect(screen.getByText('Skipped')).toBeInTheDocument()
    })
  })

  it('not_started lessons show no badge', async () => {
    mockGetLessons.mockResolvedValue(makeLessons([
      { title: 'Pending lesson', dueDate: '2026-05-12', status: 'not_started' },
    ]))
    render(<TodayLessonCard childId="child_001" today="2026-05-12" />)
    await waitFor(() => {
      expect(screen.getByText('Pending lesson')).toBeInTheDocument()
    })
    // Should not show a status badge for not_started
    expect(screen.queryByText(/not started/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/done/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/skipped/i)).not.toBeInTheDocument()
  })

  it('re-fetches when childId prop changes', async () => {
    mockGetLessons.mockResolvedValue([])
    const { rerender } = render(<TodayLessonCard childId="child_001" today="2026-05-12" />)
    await waitFor(() => expect(mockGetLessons).toHaveBeenCalledTimes(1))

    rerender(<TodayLessonCard childId="child_002" today="2026-05-12" />)
    await waitFor(() => expect(mockGetLessons).toHaveBeenCalledTimes(2))
    expect(mockGetLessons).toHaveBeenLastCalledWith(
      expect.any(String),
      ['child_002']
    )
  })

  it('heading shows formatted today date', async () => {
    mockGetLessons.mockResolvedValue([])
    render(<TodayLessonCard childId="child_001" today="2026-05-12" />)
    await waitFor(() => {
      expect(screen.getByText(/May 12/)).toBeInTheDocument()
    })
  })

  describe('externalLessons prop', () => {
    it('skips fetch and shows lessons from externalLessons immediately', () => {
      const external = makeLessons([{ title: 'External lesson', dueDate: '2026-05-15' }])
      render(<TodayLessonCard childId="child_001" today="2026-05-15" externalLessons={external} />)
      expect(screen.getByText('External lesson')).toBeInTheDocument()
      expect(mockGetLessons).not.toHaveBeenCalled()
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })

    it('filters externalLessons to only today and the given childId', () => {
      const external = makeLessons([
        { title: 'Today for child_001', dueDate: '2026-05-15', childId: 'child_001' },
        { title: 'Other day', dueDate: '2026-05-16', childId: 'child_001' },
        { title: 'Other child', dueDate: '2026-05-15', childId: 'child_002' },
      ])
      render(<TodayLessonCard childId="child_001" today="2026-05-15" externalLessons={external} />)
      expect(screen.getByText('Today for child_001')).toBeInTheDocument()
      expect(screen.queryByText('Other day')).not.toBeInTheDocument()
      expect(screen.queryByText('Other child')).not.toBeInTheDocument()
    })

    it('shows empty state when externalLessons has no lessons for today', () => {
      const external = makeLessons([{ dueDate: '2026-05-16' }])
      render(<TodayLessonCard childId="child_001" today="2026-05-15" externalLessons={external} />)
      expect(screen.getByText(/no lessons scheduled for today/i)).toBeInTheDocument()
      expect(mockGetLessons).not.toHaveBeenCalled()
    })

    it('updates displayed lessons when externalLessons prop changes', () => {
      const initial = makeLessons([{ title: 'Initial lesson', dueDate: '2026-05-15' }])
      const { rerender } = render(
        <TodayLessonCard childId="child_001" today="2026-05-15" externalLessons={initial} />
      )
      expect(screen.getByText('Initial lesson')).toBeInTheDocument()

      const updated = makeLessons([
        { title: 'Initial lesson', dueDate: '2026-05-15' },
        { title: 'New lesson', dueDate: '2026-05-15' },
      ])
      rerender(<TodayLessonCard childId="child_001" today="2026-05-15" externalLessons={updated} />)
      expect(screen.getByText('Initial lesson')).toBeInTheDocument()
      expect(screen.getByText('New lesson')).toBeInTheDocument()
      expect(mockGetLessons).not.toHaveBeenCalled()
    })
  })
})
