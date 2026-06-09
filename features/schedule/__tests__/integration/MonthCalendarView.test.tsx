import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

import { MonthCalendarView } from '@/features/schedule/front/components/MonthCalendarView'
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

// March 2026 (Monday start): grid is Feb 23 – Apr 5 (42 days)
function marchDays(): string[] {
  const days: string[] = []
  // Feb 23 – Apr 5
  const start = new Date(2026, 1, 23) // Feb 23
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  return days
}

const MARCH_DAYS = marchDays()

describe('MonthCalendarView', () => {
  beforeEach(() => { mockPush.mockReset() })

  it('renders loading state', () => {
    render(<MonthCalendarView days={MARCH_DAYS} lessonsByDate={new Map()} focusedMonth="2026-03" loading />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders a grid with the correct number of cells (42 for March 2026)', () => {
    render(<MonthCalendarView days={MARCH_DAYS} lessonsByDate={new Map()} focusedMonth="2026-03" />)
    const cells = screen.getAllByTestId('month-day-cell')
    expect(cells).toHaveLength(42)
  })

  it('renders weekday header row (Mon–Sun)', () => {
    render(<MonthCalendarView days={MARCH_DAYS} lessonsByDate={new Map()} focusedMonth="2026-03" />)
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Sun')).toBeInTheDocument()
  })

  it('lead/trail cells are marked dimmed (have data-lead-trail attribute)', () => {
    render(<MonthCalendarView days={MARCH_DAYS} lessonsByDate={new Map()} focusedMonth="2026-03" />)
    const cells = screen.getAllByTestId('month-day-cell')
    // Feb 23–28 = 6 lead days, Apr 1–5 = 5 trail days → 11 dimmed cells
    const dimmedCells = cells.filter(c => c.getAttribute('data-lead-trail') === 'true')
    expect(dimmedCells.length).toBeGreaterThanOrEqual(6) // at least the lead days
  })

  it('in-month cells are NOT marked as lead/trail', () => {
    render(<MonthCalendarView days={MARCH_DAYS} lessonsByDate={new Map()} focusedMonth="2026-03" />)
    const cells = screen.getAllByTestId('month-day-cell')
    const marchCells = cells.filter(c => c.getAttribute('data-lead-trail') !== 'true')
    expect(marchCells).toHaveLength(31) // March has 31 days
  })

  it('shows lesson count for days with lessons', () => {
    const map = new Map<string, LessonTask[]>([
      ['2026-03-16', [
        makeLesson({ id: 'l1', dueDate: '2026-03-16' }),
        makeLesson({ id: 'l2', dueDate: '2026-03-16' }),
        makeLesson({ id: 'l3', dueDate: '2026-03-16' }),
      ]],
    ])
    render(<MonthCalendarView days={MARCH_DAYS} lessonsByDate={map} focusedMonth="2026-03" />)
    expect(screen.getByText(/3 lessons/i)).toBeInTheDocument()
  })

  it('shows "1 lesson" singular for a single lesson day', () => {
    const map = new Map<string, LessonTask[]>([
      ['2026-03-16', [makeLesson({ id: 'l1', dueDate: '2026-03-16' })]],
    ])
    render(<MonthCalendarView days={MARCH_DAYS} lessonsByDate={map} focusedMonth="2026-03" />)
    expect(screen.getByText(/1 lesson/i)).toBeInTheDocument()
  })

  it('clicking an in-month cell navigates to day view', () => {
    render(<MonthCalendarView days={MARCH_DAYS} lessonsByDate={new Map()} focusedMonth="2026-03" />)
    const cells = screen.getAllByTestId('month-day-cell')
    // March 1 is the 7th cell (0-indexed: Feb 23–28 = 6 lead, then Mar 1)
    const marchFirstCell = cells[6]
    fireEvent.click(marchFirstCell)
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('date=2026-03-01'))
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('view=day'))
  })

  it('lead/trail cells are non-interactive (data-lead-trail=true)', () => {
    render(<MonthCalendarView days={MARCH_DAYS} lessonsByDate={new Map()} focusedMonth="2026-03" />)
    const cells = screen.getAllByTestId('month-day-cell')
    const leadCell = cells[0] // Feb 23
    fireEvent.click(leadCell)
    // Lead/trail cells should not navigate
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('renders day numbers inside each cell', () => {
    render(<MonthCalendarView days={MARCH_DAYS} lessonsByDate={new Map()} focusedMonth="2026-03" />)
    // March 15 should appear as "15"
    expect(screen.getByTestId('month-day-15')).toBeInTheDocument()
  })
})
