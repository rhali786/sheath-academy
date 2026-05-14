import type { ApiResponse } from '@/features/lib/types'
import type { LessonTask, CreateLessonTaskInput, UpdateLessonTaskInput } from '@/features/lesson-tasks/types'

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  const port = process.env.PORT || '3000'
  return `http://127.0.0.1:${port}`
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, options)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export const lessonTasksApi = {
  getLessonTasks: (filters?: {
    childId?: string
    subjectId?: string
    date?: string
  }): Promise<ApiResponse<LessonTask[]>> => {
    const params = new URLSearchParams()
    if (filters?.childId) params.set('childId', filters.childId)
    if (filters?.subjectId) params.set('subjectId', filters.subjectId)
    if (filters?.date) params.set('date', filters.date)
    const qs = params.toString()
    return apiFetch(qs ? `/api/lesson-tasks?${qs}` : '/api/lesson-tasks')
  },

  getLessonTask: (id: string): Promise<ApiResponse<LessonTask>> =>
    apiFetch(`/api/lesson-tasks/${encodeURIComponent(id)}`),

  createLessonTask: (input: CreateLessonTaskInput): Promise<ApiResponse<LessonTask>> =>
    apiFetch('/api/lesson-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),

  updateLessonTask: (id: string, input: UpdateLessonTaskInput): Promise<ApiResponse<LessonTask>> =>
    apiFetch(`/api/lesson-tasks/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),

  deleteLessonTask: (id: string): Promise<ApiResponse<null>> =>
    apiFetch(`/api/lesson-tasks/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
