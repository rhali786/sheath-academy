export type TimeChannelType = 'scheduled' | 'stopwatch' | 'timer'
export type SessionStatus = 'draft' | 'running' | 'paused' | 'ended' | 'finalized'
export type EndedBy = 'time' | 'manual'
export type Outcome = 'complete' | 'partial' | 'abandoned'

export const TIME_CHANNEL_TYPES: TimeChannelType[] = ['scheduled', 'stopwatch', 'timer']
export const SESSION_STATUSES: SessionStatus[] = ['draft', 'running', 'paused', 'ended', 'finalized']
export const OUTCOMES: Outcome[] = ['complete', 'partial', 'abandoned']
export const SESSION_ACTIONS = ['start', 'pause', 'resume', 'end', 'finalize'] as const
export type SessionAction = (typeof SESSION_ACTIONS)[number]

export function isTimeChannelType(value: string): value is TimeChannelType {
  return (TIME_CHANNEL_TYPES as string[]).includes(value)
}

export function isOutcome(value: string): value is Outcome {
  return (OUTCOMES as string[]).includes(value)
}

export function isSessionAction(value: string): value is SessionAction {
  return (SESSION_ACTIONS as readonly string[]).includes(value)
}

export interface LearningTimeSession {
  id: string
  householdId: string
  learnerId: string
  subjectId: string | null
  lessonTaskId: string | null
  timeChannelType: TimeChannelType
  targetMinutes: number | null
  scheduledStart: string | null
  scheduledEnd: string | null
  status: SessionStatus
  startedAt: string | null
  pausedAt: string | null
  endedAt: string | null
  endedBy: EndedBy | null
  outcome: Outcome | null
  notes: string | null
  createdAt: string
  updatedAt: string
  /** Server-computed elapsed time for the session's active interval. Never trust a client-supplied value. */
  elapsedSeconds: number
}

export interface CreateSessionInput {
  learnerId: string
  subjectId?: string
  lessonTaskId?: string
  timeChannelType: TimeChannelType
  targetMinutes?: number
  scheduledStart?: string
  scheduledEnd?: string
}

export interface SessionTransitionInput {
  action: SessionAction
  outcome?: Outcome
  notes?: string
}

export interface SessionListFilters {
  learnerId?: string
  from?: string
  to?: string
}
