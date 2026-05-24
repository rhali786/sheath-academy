import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import type { DaySchedule, ScheduleBlock } from '@/features/schedule/types'
import type { LessonTask } from '@/features/plan/types'

// We import these after we create them
import { ScheduleNowNextCard } from '@/features/schedule/front/components/ScheduleNowNextCard'
import { SchedulePage } from '@/features/schedule/front/pages/SchedulePage'

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

const twoBlockSchedule: DaySchedule = { date: '2026-01-01', blocks: [block1, block2], isPaused: false }
const threeBlockSchedule: DaySchedule = { date: '2026-01-01', blocks: [block1, block2, block3], isPaused: false }

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
      isPaused: false,
    }
    render(<ScheduleNowNextCard schedule={schedule} currentTime="09:05" />)
    fireEvent.click(screen.getByRole('button', { name: /pause day/i }))
    fireEvent.click(screen.getByRole('button', { name: /pull independent/i }))
    // After reflow, Independent Reading should be shown as "next" before Teacher Math
    const nextTitle = screen.getByTestId('next-block-title')
    expect(nextTitle).toHaveTextContent('Independent Reading')
  })
})

describe('SchedulePage', () => {
  it('renders all 3 block start times', () => {
    render(<SchedulePage schedule={threeBlockSchedule} />)
    expect(screen.getByText('08:30')).toBeInTheDocument()
    expect(screen.getByText('09:10')).toBeInTheDocument()
    expect(screen.getByText('09:50')).toBeInTheDocument()
  })

  it('renders all 3 lesson titles', () => {
    render(<SchedulePage schedule={threeBlockSchedule} />)
    expect(screen.getByText(/Quran/i)).toBeInTheDocument()
    expect(screen.getByText(/Math/i)).toBeInTheDocument()
    expect(screen.getByText(/English Reading/i)).toBeInTheDocument()
  })
})
