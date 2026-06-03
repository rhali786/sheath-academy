import type { ApiResponse } from '@/features/lib/types'
import { LessonTask } from '../../types'
import type { SubjectProgressSummary } from '@/features/plan/utils/progressBySubject'
import type { LessonHistoryOptions } from '@/features/plan/utils/completedLessonHistory'

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

  createLesson: async (data: Omit<LessonTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<LessonTask> => {
    const response = await post<LessonTask>('/api/plan/lessons', data)
    return response.data
  },

  updateLesson: async (id: string, patch: Partial<LessonTask>): Promise<LessonTask> => {
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
}
