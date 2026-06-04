import type { ApiResponse, HouseholdProfile, DayOfWeek, DayLoadPreference, DateDisplayPreference } from '@/features/lib/types'

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
  getProfile: (): Promise<ApiResponse<HouseholdProfile | null>> =>
    get('/api/household/profile'),

  switchHousehold: (householdId: string): Promise<ApiResponse<{ householdId: string; timezone: string }>> =>
    post('/api/household/switch', { householdId }),

  setup: (familyName: string): Promise<ApiResponse<HouseholdProfile>> =>
    post('/api/household/profile', { familyName }),

  updateUserProfile: (patch: { name: string | null }): Promise<ApiResponse<{ name: string | null }>> =>
    put('/api/household/user-profile', patch),

  updateProfile: (
    patch: {
      familyName?: string
      weekStartDay?: DayOfWeek
      schoolDays?: DayOfWeek[]
      dayLoad?: Partial<Record<DayOfWeek, DayLoadPreference>>
      reportingName?: string
      timezone?: string
      dateDisplay?: DateDisplayPreference
      jumuahLeaveWindow?: string
      jumuahReturnWindow?: string
    }
  ): Promise<ApiResponse<HouseholdProfile>> =>
    put('/api/household/profile', patch),
}
