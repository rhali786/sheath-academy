import type { LessonTask } from '@/features/plan/types'

export type InstructionMode =
  | 'teacher-led'
  | 'guided'
  | 'independent'
  | 'shared-family'
  | 'tutor-led'
  | 'co-op'
  | 'async-self-paced'

export type FlexibilityState = 'locked' | 'flexible' | 'optional'

export type ReflowAction =
  | 'compress'
  | 'extend'
  | 'pull-independent-forward'
  | 'push-teacher-led-later'
  | 'convert-light-day'
  | 'reschedule-unfinished'

export interface ScheduleBlock {
  id: string
  lesson: LessonTask
  startTime: string       // HH:MM (24-hour)
  endTime: string         // HH:MM (24-hour)
  durationMinutes: number
  instructionMode?: InstructionMode
  flexibilityState?: FlexibilityState
}

export type ScheduleEntryKind = 'lesson' | 'break' | 'meal' | 'prayer'

export interface LessonScheduleEntry {
  kind: 'lesson'
  id: string
  lesson: LessonTask
  startTime: string
  endTime: string
  durationMinutes: number
  instructionMode?: InstructionMode
  flexibilityState?: FlexibilityState
}

export interface BreakScheduleEntry {
  kind: 'break' | 'meal' | 'prayer'
  id: string
  title: string
  startTime: string
  endTime: string
  durationMinutes: number
}

export type ScheduleEntry = LessonScheduleEntry | BreakScheduleEntry

export interface DaySchedule {
  date: string            // ISO yyyy-mm-dd
  /** Full timeline including synthetic breaks (Wave 5+). */
  entries: ScheduleEntry[]
  /** Lesson blocks only — used by reflow. */
  blocks: ScheduleBlock[]
  isPaused: boolean
  /** When true, entries include fixed break/lunch rows. */
  includeSyntheticBreaks?: boolean
}

export interface ScheduleSettings {
  startTime: string       // HH:MM, default '08:30'
  transitionMinutes: number
  defaultDurationMinutes?: number
  /** Insert fixed break/lunch rows when lessons exist (Wave 5). */
  includeSyntheticBreaks?: boolean
}

export interface ScheduleTemplate {
  id: string
  name: string
  startTime: string
  transitionMinutes: number
}
