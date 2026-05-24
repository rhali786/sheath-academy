import type { LessonTask, LessonDuration } from '@/features/plan/types'
import type {
  ScheduleBlock,
  DaySchedule,
  ScheduleSettings,
  ScheduleTemplate,
  ReflowAction,
} from '../types'

// ── Time helpers ──────────────────────────────────────────────────────────────

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function parseDurationMinutes(duration: LessonDuration | undefined, fallback: number): number {
  switch (duration) {
    case '15min': return 15
    case '30min': return 30
    case '45min': return 45
    case '1hr':   return 60
    default:      return fallback
  }
}

// ── Build schedule ─────────────────────────────────────────────────────────────

/**
 * Builds a DaySchedule from an ordered list of lessons, placing each block
 * back-to-back with a configurable transition gap between them.
 */
export function buildDailySchedule(
  lessons: LessonTask[],
  settings: ScheduleSettings,
): DaySchedule {
  const { startTime, transitionMinutes, defaultDurationMinutes = 30 } = settings
  let cursor = toMinutes(startTime)
  const blocks: ScheduleBlock[] = []

  for (const lesson of lessons) {
    const durationMinutes = parseDurationMinutes(lesson.estimatedDuration, defaultDurationMinutes)
    const blockStart = cursor
    const blockEnd = cursor + durationMinutes

    blocks.push({
      id: `block_${lesson.id}`,
      lesson,
      startTime: fromMinutes(blockStart),
      endTime: fromMinutes(blockEnd),
      durationMinutes,
    })

    cursor = blockEnd + transitionMinutes
  }

  return {
    date: new Date().toISOString().slice(0, 10),
    blocks,
    isPaused: false,
  }
}

// ── Reflow ────────────────────────────────────────────────────────────────────

/**
 * Applies a reflow action to a DaySchedule, adjusting block start/end times.
 *
 * - `compress`: starts remaining blocks (after currentTime) without transition gaps.
 * - `pull-independent-forward`: moves independent/optional blocks before teacher-led ones.
 * - Other actions: currently a no-op (returns schedule unchanged).
 */
export function reflow(
  action: ReflowAction,
  schedule: DaySchedule,
  currentTime: string,
): DaySchedule {
  const currentMinutes = toMinutes(currentTime)

  if (action === 'compress') {
    const blocks = [...schedule.blocks]
    let cursor = currentMinutes

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]
      if (toMinutes(block.startTime) <= currentMinutes) continue // already past

      if (block.flexibilityState === 'locked') {
        // Locked block stays; move cursor past it
        cursor = toMinutes(block.endTime)
        continue
      }

      const duration = block.durationMinutes
      blocks[i] = {
        ...block,
        startTime: fromMinutes(cursor),
        endTime: fromMinutes(cursor + duration),
      }
      cursor = cursor + duration
    }

    return { ...schedule, blocks, isPaused: true }
  }

  if (action === 'pull-independent-forward') {
    const blocks = [...schedule.blocks]
    // Find first remaining block after currentTime
    const firstRemainingIdx = blocks.findIndex(b => toMinutes(b.startTime) > currentMinutes)
    if (firstRemainingIdx === -1) return { ...schedule, isPaused: true }

    // Find first independent/optional block after the first remaining
    const independentIdx = blocks.findIndex(
      (b, i) =>
        i > firstRemainingIdx &&
        (b.instructionMode === 'independent' || b.flexibilityState === 'optional') &&
        b.flexibilityState !== 'locked',
    )
    if (independentIdx === -1) return { ...schedule, isPaused: true }

    // Move the independent block to just after firstRemainingIdx
    const [indBlock] = blocks.splice(independentIdx, 1)
    blocks.splice(firstRemainingIdx, 0, indBlock)

    // Re-time all remaining blocks from firstRemainingIdx
    let cursor = toMinutes(blocks[firstRemainingIdx - 1]?.endTime ?? fromMinutes(currentMinutes))

    // Actually reuse the start time of the first remaining slot
    const firstRemainingStart = toMinutes(
      schedule.blocks[firstRemainingIdx]?.startTime ?? fromMinutes(currentMinutes)
    )
    cursor = firstRemainingStart

    for (let i = firstRemainingIdx; i < blocks.length; i++) {
      const block = blocks[i]
      if (block.flexibilityState === 'locked') {
        cursor = toMinutes(block.endTime)
        continue
      }
      blocks[i] = {
        ...block,
        startTime: fromMinutes(cursor),
        endTime: fromMinutes(cursor + block.durationMinutes),
      }
      cursor += block.durationMinutes + 0 // no extra transition in reflow
    }

    return { ...schedule, blocks, isPaused: true }
  }

  return { ...schedule, isPaused: true }
}

// ── Templates ─────────────────────────────────────────────────────────────────

export function getScheduleTemplates(): ScheduleTemplate[] {
  return [
    { id: 'standard-monday',   name: 'Standard Monday',    startTime: '08:30', transitionMinutes: 10 },
    { id: 'co-op-tuesday',     name: 'Co-op Tuesday',      startTime: '09:00', transitionMinutes: 5  },
    { id: 'light-friday',      name: 'Light Friday',       startTime: '09:30', transitionMinutes: 15 },
    { id: 'ramadan-schedule',  name: 'Ramadan Schedule',   startTime: '10:00', transitionMinutes: 20 },
    { id: 'hifz-intensive',    name: 'Hifz Intensive Day', startTime: '06:00', transitionMinutes: 5  },
  ]
}
