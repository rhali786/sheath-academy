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

export interface DaySchedule {
  date: string            // ISO yyyy-mm-dd
  blocks: ScheduleBlock[]
  isPaused: boolean
}

export interface ScheduleSettings {
  startTime: string       // HH:MM, default '08:30'
  transitionMinutes: number
  defaultDurationMinutes?: number
}

export interface ScheduleTemplate {
  id: string
  name: string
  startTime: string
  transitionMinutes: number
}
