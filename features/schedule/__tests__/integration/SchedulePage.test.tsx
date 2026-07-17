import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { DaySchedule, ScheduleBlock } from '@/features/schedule/types'
import type { LessonTask } from '@/features/plan/types'
import { ScheduleNowNextCard } from '@/features/schedule/front/components/ScheduleNowNextCard'
import { SchedulePage } from '@/features/schedule/front/pages/SchedulePage'
import { LearnerProvider } from '@/features/layout/front/context/LearnerContext'

const mockUseSearchParams = jest.fn(() => new URLSearchParams())
jest.mock('next/navigation', () => ({
  useSearchParams: () => mockUseSearchParams(),
}))

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: { getLessons: jest.fn() },
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

jest.mock('@/features/schedule/front/components/CalendarNav', () => ({
  CalendarNav: () => <div data-testid="calendar-nav" />,
}))

jest.mock('@/features/schedule/front/components/WeekCalendarView', () => ({
  WeekCalendarView: () => <div data-testid="week-calendar-view" />,
}))

jest.mock('@/features/schedule/front/components/MonthCalendarView', () => ({
  MonthCalendarView: () => <div data-testid="month-calendar-view" />,
}))

jest.mock('@/features/schedule/front/components/ScheduleTimeline', () => ({
  ScheduleTimeline: ({ schedule }: { schedule: { blocks: { lesson: { title: string }; startTime: string }[] } }) => (
    <div data-testid="schedule-timeline">
      {schedule.blocks.map(b => (
        <div key={b.lesson.title}>
          <span>{b.startTime}</span>
          <span>{b.lesson.title}</span>
        </div>
      ))}
    </div>
  ),
}))

import { plannerApi } from '@/features/plan/front/services/api'
import { useHousehold } from '@/features/household/front/context'

const mockGetLessons = plannerApi.getLessons as jest.Mock
const mockUseHousehold = useHousehold as jest.Mock

function makeLesson(id: string, title: string): LessonTask {
  return {
    id, childId: 'c1', subjectId: 's1', householdId: 'h1',
    title, dueDate: '2026-01-01', status: 'not_started',
    order: 1, estimatedDuration: '30min',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  }
}

function makeBlock(
  lessonId: string,
  title: string,
  startTime: string,
  endTime: string,
  overrides: Partial<ScheduleBlock> = {},
): ScheduleBlock {
  return {
    id: `block_${lessonId}`,
    lesson: makeLesson(lessonId, title),
    startTime,
    endTime,
    durationMinutes: 30,
    ...overrides,
  }
}

const block1 = makeBlock('L1', 'Quran', '08:30', '09:00', { instructionMode: 'teacher-led', flexibilityState: 'locked' })
const block2 = makeBlock('L2', 'Math', '09:10', '09:40', { instructionMode: 'independent', flexibilityState: 'flexible' })
const block3 = makeBlock('L3', 'English Reading', '09:50', '10:20', { instructionMode: 'independent', flexibilityState: 'optional' })

function toEntries(blocks: ScheduleBlock[]) {
  return blocks.map(b => ({
    kind: 'lesson' as const,
    id: b.id,
    lesson: b.lesson,
    startTime: b.startTime,
    endTime: b.endTime,
    durationMinutes: b.durationMinutes,
    instructionMode: b.instructionMode,
    flexibilityState: b.flexibilityState,
  }))
}

const twoBlockSchedule: DaySchedule = {
  date: '2026-01-01',
  blocks: [block1, block2],
  entries: toEntries([block1, block2]),
  isPaused: false,
}
const threeBlockSchedule: DaySchedule = {
  date: '2026-01-01',
  blocks: [block1, block2, block3],
  entries: toEntries([block1, block2, block3]),
  isPaused: false,
}

function renderSchedulePage() {
  return render(
    <LearnerProvider>
      <SchedulePage />
    </LearnerProvider>,
  )
}

describe('ScheduleNowNextCard', () => {
  it('shows current and next lesson titles', () => {
    render(<ScheduleNowNextCard schedule={twoBlockSchedule} currentTime="08:45" />)
    expect(screen.getByText(/Quran/i)).toBeInTheDocument()
    expect(screen.getByText(/Math/i)).toBeInTheDocument()
  })

  it('shows "Pause Day" button', () => {
    render(<ScheduleNowNextCard schedule={twoBlockSchedule} currentTime="08:45" />)
    expect(screen.getByRole('button', { name: /pause day/i })).toBeInTheDocument()
  })

  it('clicking Pause Day shows reflow options panel', () => {
    render(<ScheduleNowNextCard schedule={twoBlockSchedule} currentTime="08:45" />)
    expect(screen.queryByText(/pull independent/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /pause day/i }))
    expect(screen.getByText(/pull independent/i)).toBeInTheDocument()
  })

  it('clicking pull-independent-forward moves independent lesson before flexible teacher-led', () => {
    const independentBlock = makeBlock('L3', 'Independent Reading', '09:50', '10:20', {
      instructionMode: 'independent',
      flexibilityState: 'optional',
    })
    const teacherBlock = makeBlock('L2', 'Teacher Math', '09:10', '09:40', {
      instructionMode: 'teacher-led',
      flexibilityState: 'flexible',
    })
    const schedule: DaySchedule = {
      date: '2026-01-01',
      blocks: [block1, teacherBlock, independentBlock],
      entries: toEntries([block1, teacherBlock, independentBlock]),
      isPaused: false,
    }
    render(<ScheduleNowNextCard schedule={schedule} currentTime="09:05" />)
    fireEvent.click(screen.getByRole('button', { name: /pause day/i }))
    fireEvent.click(screen.getByRole('button', { name: /pull independent/i }))
    const nextTitle = screen.getByTestId('next-block-title')
    expect(nextTitle).toHaveTextContent('Independent Reading')
  })
})

describe('SchedulePage', () => {
  beforeEach(() => {
    mockUseHousehold.mockImplementation(() => ({ allSubjects: [], householdProfile: null }))
    mockGetLessons.mockResolvedValue([])
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading state initially', () => {
    mockGetLessons.mockReturnValue(new Promise(() => {}))
    renderSchedulePage()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders schedule timeline after lessons load', async () => {
    mockGetLessons.mockResolvedValue([])
    renderSchedulePage()
    await waitFor(() => {
      expect(screen.getByTestId('schedule-timeline')).toBeInTheDocument()
    })
  })

  it('renders lesson titles in the timeline', async () => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    mockGetLessons.mockResolvedValue([
      { id: 'l1', childId: 'c1', subjectId: 's1', householdId: 'h1', title: 'Quran', dueDate: todayStr, status: 'not_started', order: 1, estimatedDuration: '30min', createdAt: '', updatedAt: '' },
      { id: 'l2', childId: 'c1', subjectId: 's1', householdId: 'h1', title: 'Math', dueDate: todayStr, status: 'not_started', order: 2, estimatedDuration: '30min', createdAt: '', updatedAt: '' },
    ])
    renderSchedulePage()
    await waitFor(() => {
      expect(screen.getByText(/Quran/i)).toBeInTheDocument()
      expect(screen.getByText(/Math/i)).toBeInTheDocument()
    })
  })

  it('day mode: fetch uses [selectedDate, selectedDate] as the window', async () => {
    renderSchedulePage()
    await waitFor(() => expect(mockGetLessons).toHaveBeenCalled())
    const [,,,startDate, endDate] = mockGetLessons.mock.calls[0]
    expect(startDate).toBe(endDate)
    expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('passes selectedChildId to getLessons when header learner is set', async () => {
    sessionStorage.setItem('sheath.selectedChildId', 'child_b')
    renderSchedulePage()
    await waitFor(() => expect(mockGetLessons).toHaveBeenCalled())
    const [, childIds] = mockGetLessons.mock.calls[mockGetLessons.mock.calls.length - 1]
    expect(childIds).toEqual(['child_b'])
  })

  it('deep-linked ?date= param is honoured and shown in the heading', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-06-01'))
    renderSchedulePage()
    await waitFor(() => expect(screen.getByText(/2026-06-01/)).toBeInTheDocument())
  })

  it('day mode renders ScheduleTimeline (regression — identical to pre-calendar-range behaviour)', async () => {
    mockGetLessons.mockResolvedValue([])
    renderSchedulePage()
    await waitFor(() => {
      expect(screen.getByTestId('schedule-timeline')).toBeInTheDocument()
    })
    // Day mode must still use ScheduleTimeline — no other view is rendered
    expect(screen.queryByTestId('week-calendar-view')).not.toBeInTheDocument()
    expect(screen.queryByTestId('month-calendar-view')).not.toBeInTheDocument()
  })

  it('week mode renders WeekCalendarView', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-03-18&view=week'))
    mockGetLessons.mockResolvedValue([])
    renderSchedulePage()
    await waitFor(() => {
      expect(screen.getByTestId('week-calendar-view')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('schedule-timeline')).not.toBeInTheDocument()
  })

  it('month mode renders MonthCalendarView', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-03-18&view=month'))
    mockGetLessons.mockResolvedValue([])
    renderSchedulePage()
    await waitFor(() => {
      expect(screen.getByTestId('month-calendar-view')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('schedule-timeline')).not.toBeInTheDocument()
    expect(screen.queryByTestId('week-calendar-view')).not.toBeInTheDocument()
  })

  it('day view for an off-day date (default Mon–Fri schedule) shows an "Off day" header indicator', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-06-06')) // Saturday
    renderSchedulePage()
    await waitFor(() => {
      expect(screen.getByTestId('schedule-timeline')).toBeInTheDocument()
    })
    expect(screen.getByText(/off day/i)).toBeInTheDocument()
  })

  it('day view for a school-day date does not show the "Off day" indicator', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-06-01')) // Monday
    renderSchedulePage()
    await waitFor(() => {
      expect(screen.getByTestId('schedule-timeline')).toBeInTheDocument()
    })
    expect(screen.queryByText(/off day/i)).not.toBeInTheDocument()
  })

  it('honors a custom household schoolDays setting for the off-day indicator', async () => {
    mockUseHousehold.mockImplementation(() => ({
      allSubjects: [],
      householdProfile: { schoolDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
    }))
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-06-06')) // Saturday, but a school day here
    renderSchedulePage()
    await waitFor(() => {
      expect(screen.getByTestId('schedule-timeline')).toBeInTheDocument()
    })
    expect(screen.queryByText(/off day/i)).not.toBeInTheDocument()
  })
})
