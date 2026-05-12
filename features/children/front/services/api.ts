import type { ApiResponse, StudentProfile } from '@/features/lib/types'

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

export const childrenApi = {
  getAllChildren: (includeArchived: boolean = false): Promise<ApiResponse<StudentProfile[]>> =>
    get(`/api/children/children?includeArchived=${includeArchived}`),

  getChildren: (householdId: string, includeArchived: boolean = false): Promise<ApiResponse<StudentProfile[]>> =>
    get(`/api/children/children?householdId=${householdId}&includeArchived=${includeArchived}`),

  getChild: (id: string): Promise<ApiResponse<StudentProfile | null>> =>
    get(`/api/children/children/${id}`),

  createChild: (data: Partial<StudentProfile> & { householdId: string; name: string; gradeLabel: string; username: string; password: string }): Promise<ApiResponse<StudentProfile>> =>
    post('/api/children/children', data),

  updateChild: (id: string, data: Partial<StudentProfile>): Promise<ApiResponse<StudentProfile>> =>
    put(`/api/children/children/${id}`, data),

  archiveChild: (id: string): Promise<ApiResponse<StudentProfile>> =>
    patch(`/api/children/children/${id}/archive`),

  restoreChild: (id: string): Promise<ApiResponse<StudentProfile>> =>
    patch(`/api/children/children/${id}/restore`),
}
