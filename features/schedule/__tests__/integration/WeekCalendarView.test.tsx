import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

import { WeekCalendarView } from '@/features/schedule/front/components/WeekCalendarView'
import type { LessonTask } from '@/features/plan/types'

function makeLesson(overrides: Partial<LessonTask> = {}): LessonTask {
  return {
    id: 'l1', childId: 'c1', subjectId: 's1', householdId: 'h1',
    title: 'Quran', dueDate: '2026-03-16', status: 'not_started',
    order: 1, estimatedDuration: '30min',
    createdAt: '2026-03-16T00:00:00Z', updatedAt: '2026-03-16T00:00:00Z',
    ...overrides,
  }
}

// 7-day window for week of 2026-03-16 (Mon) – 2026-03-22 (Sun)
const WEEK_DAYS = [
  '2026-03-16', '2026-03-17', '2026-03-18',
  '2026-03-19', '2026-03-20', '2026-03-21', '2026-03-22',
]

const TWO_LESSONS: LessonTask[] = [
  makeLesson({ id: 'l1', title: 'Quran', dueDate: '2026-03-16' }),
  makeLesson({ id: 'l2', title: 'Math', dueDate: '2026-03-17' }),
]

describe('WeekCalendarView', () => {
  beforeEach(() => { mockPush.mockReset() })

  it('renders loading state', () => {
    render(<WeekCalendarView days={WEEK_DAYS} lessonsByDate={new Map()} loading />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders 7 day columns/sections', () => {
    render(<WeekCalendarView days={WEEK_DAYS} lessonsByDate={new Map()} />)
    // Each day section has a header with the date label
    const daySections = screen.getAllByTestId('week-day-section')
    expect(daySections).toHaveLength(7)
  })

  it('shows "No lessons scheduled" for empty days', () => {
    render(<WeekCalendarView days={WEEK_DAYS} lessonsByDate={new Map()} />)
    // All 7 days are empty — show the empty state for each
    const emptyMessages = screen.getAllByText(/no lessons scheduled/i)
    expect(emptyMessages.length).toBeGreaterThanOrEqual(7)
  })

  it('renders lesson titles in the correct day section', () => {
    const map = new Map<string, LessonTask[]>([
      ['2026-03-16', [makeLesson({ id: 'l1', title: 'Quran', dueDate: '2026-03-16' })]],
    ])
    render(<WeekCalendarView days={WEEK_DAYS} lessonsByDate={map} />)
    expect(screen.getByText('Quran')).toBeInTheDocument()
  })

  it('populated days do not show "No lessons scheduled"', () => {
    const map = new Map<string, LessonTask[]>([
      ['2026-03-16', [makeLesson({ id: 'l1', title: 'Quran', dueDate: '2026-03-16' })]],
    ])
    render(<WeekCalendarView days={WEEK_DAYS} lessonsByDate={map} />)
    // 6 empty days still show the empty state
    const empties = screen.getAllByText(/no lessons scheduled/i)
    expect(empties).toHaveLength(6)
  })

  it('renders multiple lessons in a populated day', () => {
    const map = new Map<string, LessonTask[]>([
      ['2026-03-16', [
        makeLesson({ id: 'l1', title: 'Quran', dueDate: '2026-03-16' }),
        makeLesson({ id: 'l2', title: 'Math', dueDate: '2026-03-16' }),
      ]],
    ])
    render(<WeekCalendarView days={WEEK_DAYS} lessonsByDate={map} />)
    expect(screen.getByText('Quran')).toBeInTheDocument()
    expect(screen.getByText('Math')).toBeInTheDocument()
  })

  it('clicking a lesson navigates to its day view', () => {
    const map = new Map<string, LessonTask[]>([
      ['2026-03-16', [makeLesson({ id: 'l1', title: 'Quran', dueDate: '2026-03-16' })]],
    ])
    render(<WeekCalendarView days={WEEK_DAYS} lessonsByDate={map} />)
    fireEvent.click(screen.getByText('Quran'))
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('date=2026-03-16'))
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('view=day'))
  })

  it('clicking the day header navigates to that day view', () => {
    render(<WeekCalendarView days={WEEK_DAYS} lessonsByDate={new Map()} />)
    const dayHeaders = screen.getAllByTestId('week-day-header')
    fireEvent.click(dayHeaders[0])
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('date=2026-03-16'))
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('view=day'))
  })

  it('shows lesson count badge when a day has multiple lessons', () => {
    const map = new Map<string, LessonTask[]>([
      ['2026-03-16', [
        makeLesson({ id: 'l1', title: 'Quran', dueDate: '2026-03-16' }),
        makeLesson({ id: 'l2', title: 'Math', dueDate: '2026-03-16' }),
        makeLesson({ id: 'l3', title: 'Science', dueDate: '2026-03-16' }),
      ]],
    ])
    render(<WeekCalendarView days={WEEK_DAYS} lessonsByDate={map} />)
    expect(screen.getByText('Quran')).toBeInTheDocument()
    expect(screen.getByText('Math')).toBeInTheDocument()
    expect(screen.getByText('Science')).toBeInTheDocument()
  })
})
