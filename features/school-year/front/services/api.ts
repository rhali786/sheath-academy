import type { ApiResponse } from '@/features/lib/types'
import type { SchoolYear } from '@/features/school-year/types'

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

export const schoolYearApi = {
  getSchoolYears: (): Promise<ApiResponse<SchoolYear[]>> =>
    get('/api/school-years'),

  getActiveSchoolYear: (): Promise<ApiResponse<SchoolYear | null>> =>
    get('/api/school-years/active'),

  getSchoolYear: (id: string): Promise<ApiResponse<SchoolYear | null>> =>
    get(`/api/school-years/${id}`),

  createSchoolYear: (data: { name: string; startDate: string; endDate: string; isActive?: boolean }): Promise<ApiResponse<SchoolYear>> =>
    post('/api/school-years', data),

  updateSchoolYear: (id: string, data: Partial<SchoolYear>): Promise<ApiResponse<SchoolYear>> =>
    put(`/api/school-years/${id}`, data),

  activateSchoolYear: (id: string): Promise<ApiResponse<SchoolYear>> =>
    patch(`/api/school-years/${id}/activate`),
}
