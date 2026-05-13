import type { ApiResponse } from '@/features/lib/types'
import { LessonTask } from '../../types'

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
  getLessons: async (week: string, childIds?: string[], subjectIds?: string[]): Promise<LessonTask[]> => {
    const params = new URLSearchParams({ week })
    if (childIds && childIds.length > 0) params.append('childIds', childIds.join(','))
    if (subjectIds && subjectIds.length > 0) params.append('subjectIds', subjectIds.join(','))
    const response = await get<LessonTask[]>(`/api/planner/lessons?${params}`)
    return response.data
  },

  getLesson: async (id: string): Promise<LessonTask | null> => {
    try {
      const response = await get<LessonTask>(`/api/planner/lessons/${id}`)
      return response.data
    } catch {
      return null
    }
  },

  createLesson: async (data: Omit<LessonTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<LessonTask> => {
    const response = await post<LessonTask>('/api/planner/lessons', data)
    return response.data
  },

  updateLesson: async (id: string, patch: Partial<LessonTask>): Promise<LessonTask> => {
    const response = await put<LessonTask>(`/api/planner/lessons/${id}`, patch)
    return response.data
  },

  completeLesson: async (id: string): Promise<LessonTask> => {
    const response = await patch<LessonTask>(`/api/planner/lessons/${id}/complete`)
    return response.data
  },
}
