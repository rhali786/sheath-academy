import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { SubjectProgressCard } from '@/features/dashboard/front/components/SubjectProgressCard'
import { RecentLessonsCard } from '@/features/dashboard/front/components/RecentLessonsCard'
import type { SubjectProgressSummary } from '@/features/planner/utils/progressBySubject'
import type { LessonTask } from '@/features/planner/types'

jest.mock('@/features/planner/front/services/api', () => ({
  plannerApi: {
    getProgress: jest.fn(),
    getHistory: jest.fn(),
  },
}))

import { plannerApi } from '@/features/planner/front/services/api'
const mockGetProgress = plannerApi.getProgress as jest.Mock
const mockGetHistory = plannerApi.getHistory as jest.Mock

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
]

function makeLesson(id: string, title: string): LessonTask {
  return {
    id,
    childId: 'child_a',
    subjectId: 'subj_math',
    householdId: 'hh_1',
    title,
    dueDate: '2026-05-12',
    status: 'completed' as const,
    order: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }
}

describe('SubjectProgressCard (dashboard)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows loading state', () => {
    mockGetProgress.mockReturnValue(new Promise(() => {}))
    render(<SubjectProgressCard />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders progress rows after loading', async () => {
    mockGetProgress.mockResolvedValue(mockSummaries)
    render(<SubjectProgressCard />)
    await waitFor(() => {
      expect(screen.getByText('Math')).toBeInTheDocument()
    })
  })

  it('shows empty state when no data', async () => {
    mockGetProgress.mockResolvedValue([])
    render(<SubjectProgressCard />)
    await waitFor(() => {
      expect(screen.getByText(/no lessons/i)).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    mockGetProgress.mockRejectedValue(new Error('fail'))
    render(<SubjectProgressCard />)
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })
  })

  it('displays child name', async () => {
    mockGetProgress.mockResolvedValue(mockSummaries)
    render(<SubjectProgressCard />)
    await waitFor(() => {
      expect(screen.getByText('Adam')).toBeInTheDocument()
    })
  })
})

describe('RecentLessonsCard (dashboard)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows loading state', () => {
    mockGetHistory.mockReturnValue(new Promise(() => {}))
    render(<RecentLessonsCard />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders lesson titles after loading', async () => {
    mockGetHistory.mockResolvedValue([makeLesson('l1', 'Math Lesson 1')])
    render(<RecentLessonsCard />)
    await waitFor(() => {
      expect(screen.getByText('Math Lesson 1')).toBeInTheDocument()
    })
  })

  it('shows empty state when no history', async () => {
    mockGetHistory.mockResolvedValue([])
    render(<RecentLessonsCard />)
    await waitFor(() => {
      expect(screen.getByText(/no completed lessons/i)).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    mockGetHistory.mockRejectedValue(new Error('fail'))
    render(<RecentLessonsCard />)
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })
  })

  it('passes limit=5 to getHistory by default', async () => {
    mockGetHistory.mockResolvedValue([])
    render(<RecentLessonsCard />)
    await waitFor(() => {
      expect(mockGetHistory).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }))
    })
  })
})
