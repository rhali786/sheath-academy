import type { ApiResponse, Workspace, HouseholdProfile } from '@/features/lib/types'

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

export const householdApi = {
  getWorkspace: (): Promise<ApiResponse<Workspace | null>> =>
    get('/api/household/workspace'),

  getProfile: (): Promise<ApiResponse<HouseholdProfile | null>> =>
    get('/api/household/profile'),

  setup: (familyName: string): Promise<ApiResponse<{ workspace: Workspace; profile: HouseholdProfile }>> =>
    post('/api/household/workspace', { familyName }),

  updateProfile: (
    familyName?: string,
    weekStartDay?: 'Monday' | 'Sunday'
  ): Promise<ApiResponse<HouseholdProfile>> => {
    const body: Record<string, string> = {}
    if (familyName !== undefined) body.familyName = familyName
    if (weekStartDay !== undefined) body.weekStartDay = weekStartDay
    return put('/api/household/profile', body)
  },
}
