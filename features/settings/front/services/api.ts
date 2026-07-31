import type { ApiResponse } from '@/features/lib/types'

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return `http://127.0.0.1:${process.env.PORT ?? '3000'}`
}

async function get<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

async function mutate<T>(path: string, method: 'PUT', body?: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export const settingsApi = {
  getSettings: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    return get<Record<string, unknown>>('/api/settings')
  },

  updateSettings: async (patch: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown> | null>> => {
    return mutate<Record<string, unknown> | null>('/api/settings', 'PUT', patch)
  },
}
