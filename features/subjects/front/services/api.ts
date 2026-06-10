import type { ApiResponse } from '@/features/lib/types'
import type { SubjectCourse, SubjectCourseCategory } from '@/features/subjects/types'

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

export const subjectsApi = {
  getSubjects: (childId?: string): Promise<ApiResponse<SubjectCourse[]>> =>
    get(childId ? `/api/subjects?childId=${encodeURIComponent(childId)}` : '/api/subjects'),

  createSubject: (body: {
    childId?: string
    learnerIds?: string[]
    name: string
    category: SubjectCourseCategory
    customCategory?: string
    instructorName?: string
    level?: string
    schoolYearId?: string
    order?: number
  }): Promise<ApiResponse<SubjectCourse>> => post('/api/subjects', body),

  updateSubject: (
    id: string,
    body: {
      name?: string
      category?: SubjectCourseCategory
      childId?: string
      learnerIds?: string[]
      order?: number
    }
  ): Promise<ApiResponse<SubjectCourse>> =>
    put(`/api/subjects/${encodeURIComponent(id)}`, body),

  archiveSubject: (id: string): Promise<ApiResponse<SubjectCourse>> =>
    patch(`/api/subjects/${encodeURIComponent(id)}/archive`),

  rolloverCourses: (body: {
    fromYearId: string
    toYearId: string
    courseIds?: string[]
  }): Promise<ApiResponse<SubjectCourse[]>> => post('/api/subjects/rollover', body),
}
