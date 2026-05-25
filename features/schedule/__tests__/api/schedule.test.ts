import { buildDailySchedule, reflow, getScheduleTemplates } from '../../server/service'
import type { LessonTask } from '@/features/plan/types'
import type { DaySchedule, ScheduleSettings } from '../../types'

function makeLesson(id: string, title: string, estimatedDuration?: LessonTask['estimatedDuration']): LessonTask {
  return {
    id,
    childId: 'child_001',
    subjectId: 'subject_001',
    householdId: 'household_001',
    title,
    dueDate: '2026-01-01',
    status: 'not_started',
    order: 1,
    estimatedDuration,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }
}

const DEFAULT_SETTINGS: ScheduleSettings = {
  startTime: '08:30',
  transitionMinutes: 10,
  defaultDurationMinutes: 30,
}

describe('buildDailySchedule', () => {
  it('returns blocks with start/end times accounting for transition time', () => {
    const lessons = [
      makeLesson('L1', 'Quran', '30min'),
      makeLesson('L2', 'Math', '45min'),
    ]
    const schedule = buildDailySchedule(lessons, DEFAULT_SETTINGS)
    expect(schedule.blocks).toHaveLength(2)

    // Block 1: 08:30 → 09:00 (30 min)
    expect(schedule.blocks[0].startTime).toBe('08:30')
    expect(schedule.blocks[0].endTime).toBe('09:00')

    // Block 2: 09:10 → 09:55 (10-min transition + 45 min)
    expect(schedule.blocks[1].startTime).toBe('09:10')
    expect(schedule.blocks[1].endTime).toBe('09:55')
  })

  it('30-min lesson + 10-min transition → next block starts 40 min after previous start', () => {
    const lessons = [
      makeLesson('L1', 'Lesson A', '30min'),
      makeLesson('L2', 'Lesson B', '30min'),
    ]
    const schedule = buildDailySchedule(lessons, DEFAULT_SETTINGS)
    const [b1, b2] = schedule.blocks

    const start1 = b1.startTime.split(':').map(Number)
    const start2 = b2.startTime.split(':').map(Number)
    const minutesDiff = (start2[0] * 60 + start2[1]) - (start1[0] * 60 + start1[1])
    expect(minutesDiff).toBe(40) // 30 (lesson) + 10 (transition)
  })

  it('uses defaultDurationMinutes when lesson has no estimatedDuration', () => {
    const lessons = [makeLesson('L1', 'No Duration')]
    const schedule = buildDailySchedule(lessons, { startTime: '09:00', transitionMinutes: 0, defaultDurationMinutes: 25 })
    expect(schedule.blocks[0].durationMinutes).toBe(25)
    expect(schedule.blocks[0].endTime).toBe('09:25')
  })

  it('returns a DaySchedule with isPaused false initially', () => {
    const schedule = buildDailySchedule([], DEFAULT_SETTINGS)
    expect(schedule.isPaused).toBe(false)
    expect(schedule.blocks).toHaveLength(0)
    expect(schedule.entries).toHaveLength(0)
  })

  it('includes synthetic breaks when includeSyntheticBreaks is true', () => {
    const lessons = [makeLesson('L1', 'Quran', '30min')]
    const schedule = buildDailySchedule(lessons, { ...DEFAULT_SETTINGS, includeSyntheticBreaks: true })
    expect(schedule.entries.length).toBeGreaterThan(schedule.blocks.length)
    expect(schedule.entries.some(e => e.kind === 'break')).toBe(true)
    expect(schedule.entries.some(e => e.kind === 'meal')).toBe(true)
  })
})

describe('reflow', () => {
  function makeSchedule(overrides?: Partial<DaySchedule>): DaySchedule {
    const lessons = [
      makeLesson('L1', 'Quran', '30min'),
      makeLesson('L2', 'Math', '30min'),
      makeLesson('L3', 'English', '30min'),
    ]
    const base = buildDailySchedule(lessons, DEFAULT_SETTINGS)
    return { ...base, ...overrides }
  }

  it('compress: re-times remaining blocks to start closer together', () => {
    const schedule = makeSchedule()
    // Schedule: 08:30-09:00, 09:10-09:40, 09:50-10:20
    // Compress after 09:05 (mid-transition after block 1)
    const compressed = reflow('compress', schedule, '09:05')
    // Block 2 should now start at 09:05 instead of 09:10
    const block2 = compressed.blocks.find(b => b.lesson.id === 'L2')!
    expect(block2.startTime).toBe('09:05')
    // Block 3 should follow immediately after block 2
    expect(compressed.blocks.find(b => b.lesson.id === 'L3')!.startTime).toBe('09:35')
  })

  it('reflow does not move locked blocks', () => {
    const schedule = makeSchedule()
    // Mark block 2 as locked
    schedule.blocks[1] = { ...schedule.blocks[1], flexibilityState: 'locked' }
    const compressed = reflow('compress', schedule, '09:05')
    // Locked block 2 stays at 09:10
    expect(compressed.blocks[1].startTime).toBe('09:10')
  })

  it('pull-independent-forward moves optional/independent lesson before flexible ones', () => {
    const lessons = [
      makeLesson('L1', 'Quran', '30min'),
      makeLesson('L2', 'Teacher-Led Math', '30min'),
      makeLesson('L3', 'Independent Reading', '30min'),
    ]
    const schedule = buildDailySchedule(lessons, DEFAULT_SETTINGS)
    // Mark L2 as teacher-led flexible, L3 as independent optional
    schedule.blocks[1] = { ...schedule.blocks[1], instructionMode: 'teacher-led', flexibilityState: 'flexible' }
    schedule.blocks[2] = { ...schedule.blocks[2], instructionMode: 'independent', flexibilityState: 'optional' }

    const reflowed = reflow('pull-independent-forward', schedule, '09:05')
    // L3 (independent) should now appear before L2 (teacher-led)
    const l2Idx = reflowed.blocks.findIndex(b => b.lesson.id === 'L2')
    const l3Idx = reflowed.blocks.findIndex(b => b.lesson.id === 'L3')
    expect(l3Idx).toBeLessThan(l2Idx)
  })
})

describe('getScheduleTemplates', () => {
  it('returns at least 3 named templates', () => {
    const templates = getScheduleTemplates()
    expect(templates.length).toBeGreaterThanOrEqual(3)
    const names = templates.map(t => t.name)
    expect(names).toContain('Standard Monday')
    expect(names).toContain('Ramadan Schedule')
  })
})
