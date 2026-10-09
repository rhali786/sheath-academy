import type { ApiResponse } from '@/features/lib/types'
import { LessonTask } from '../../types'
import type { LessonTaskPatch, LessonStep, LessonDateMove, ShiftApplyResult, ShiftLessonsRequest, ShiftPreview } from '../../types'
import type { SubjectProgressSummary } from '@/features/plan/utils/progressBySubject'
import type { LessonHistoryOptions } from '@/features/plan/utils/completedLessonHistory'

export interface LessonStepInput {
  stepText: string
  type?: string
  order?: number
  doneCriteria?: string | null
  quantity?: number | null
}

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  const port = process.env.PORT || '3000'
  return `http://127.0.0.1:${port}`
}

async function get<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

async function post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

/** Like post(), but surfaces the server's message (used where the user must see why it failed). */
async function postWithMessage<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

async function put<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

async function patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export const plannerApi = {
  getLessons: async (
    week?: string,
    childIds?: string[],
    subjectIds?: string[],
    startDate?: string,
    endDate?: string,
  ): Promise<LessonTask[]> => {
    const params = new URLSearchParams()
    if (week) params.set('week', week)
    if (childIds && childIds.length > 0) params.append('childIds', childIds.join(','))
    if (subjectIds && subjectIds.length > 0) params.append('subjectIds', subjectIds.join(','))
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    const paramStr = params.toString()
    const response = await get<LessonTask[]>(`/api/plan/lessons${paramStr ? `?${paramStr}` : ''}`)
    return response.data
  },

  getLesson: async (id: string): Promise<LessonTask | null> => {
    try {
      const response = await get<LessonTask>(`/api/plan/lessons/${id}`)
      return response.data
    } catch {
      return null
    }
  },

  createLesson: async (data: Omit<LessonTask, 'id' | 'createdAt' | 'updatedAt' | 'scheduledStartTime' | 'scheduledEndTime'> & {
    // The create route treats null like blank (no time of its own).
    scheduledStartTime?: string | null
    scheduledEndTime?: string | null
    childIds?: string[]
    assignments?: { childId: string; subjectId: string }[]
  }): Promise<LessonTask> => {
    const response = await post<LessonTask>('/api/plan/lessons', data)
    return response.data
  },

  updateLesson: async (id: string, patch: LessonTaskPatch): Promise<LessonTask> => {
    const response = await put<LessonTask>(`/api/plan/lessons/${id}`, patch)
    return response.data
  },

  completeLesson: async (id: string, status: 'completed' | 'skipped' = 'completed'): Promise<LessonTask> => {
    const response = await patch<LessonTask>(`/api/plan/lessons/${id}/complete`, { status })
    return response.data
  },

  deleteLesson: async (id: string): Promise<void> => {
    const res = await fetch(`${getApiBaseUrl()}/api/plan/lessons/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  },

  getProgress: async (
    scope: 'week' | 'year',
    dateRange: { start: string; end: string },
    childId?: string
  ): Promise<SubjectProgressSummary[]> => {
    const params = new URLSearchParams({ scope, start: dateRange.start, end: dateRange.end })
    if (childId) params.set('childId', childId)
    const response = await get<SubjectProgressSummary[]>(`/api/plan/progress?${params}`)
    return response.data
  },

  // ─── Lesson steps ──────────────────────────────────────────────────────────
  listSteps: async (lessonId: string): Promise<LessonStep[]> => {
    const response = await get<LessonStep[]>(`/api/plan/lessons/${encodeURIComponent(lessonId)}/steps`)
    return response.data
  },

  createStep: async (lessonId: string, input: LessonStepInput): Promise<LessonStep> => {
    const response = await post<LessonStep>(`/api/plan/lessons/${encodeURIComponent(lessonId)}/steps`, input)
    return response.data
  },

  updateStep: async (lessonId: string, stepId: string, patchBody: LessonStepInput): Promise<LessonStep> => {
    const response = await patch<LessonStep>(`/api/plan/lessons/${encodeURIComponent(lessonId)}/steps/${encodeURIComponent(stepId)}`, patchBody)
    return response.data
  },

  deleteStep: async (lessonId: string, stepId: string): Promise<void> => {
    const res = await fetch(`${getApiBaseUrl()}/api/plan/lessons/${encodeURIComponent(lessonId)}/steps/${encodeURIComponent(stepId)}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  },

  getHistory: async (options: LessonHistoryOptions = {}): Promise<LessonTask[]> => {
    const params = new URLSearchParams()
    if (options.childId) params.set('childId', options.childId)
    if (options.subjectId) params.set('subjectId', options.subjectId)
    if (options.startDate) params.set('startDate', options.startDate)
    if (options.endDate) params.set('endDate', options.endDate)
    if (options.limit !== undefined) params.set('limit', String(options.limit))
    if (options.showAll) params.set('showAll', 'true')
    if (options.showPending) params.set('showPending', 'true')
    const response = await get<LessonTask[]>(`/api/plan/history?${params}`)
    return response.data
  },

  previewShift: async (request: ShiftLessonsRequest): Promise<ShiftPreview> => {
    const response = await postWithMessage<ShiftPreview>('/api/plan/lessons/shift/preview', request)
    return response.data
  },

  /** Applies previewed moves. Undo = the same call with each move's from/to swapped. */
  applyShift: async (moves: Pick<LessonDateMove, 'id' | 'from' | 'to'>[]): Promise<ShiftApplyResult> => {
    const response = await postWithMessage<ShiftApplyResult>('/api/plan/lessons/shift/apply', { moves })
    return response.data
  },
}
