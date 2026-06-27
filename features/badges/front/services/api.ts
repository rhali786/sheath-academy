import type { ApiResponse } from '@/features/lib/types'
import type { BadgeDefinition, BadgeAward, BadgeCollectionItem, BadgeSettings } from '@/features/badges/types'

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return `http://127.0.0.1:${process.env.PORT ?? '3000'}`
}

async function get<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export const badgesApi = {
  getCollection: async (_householdId: string, learnerId: string): Promise<ApiResponse<BadgeCollectionItem[]>> => {
    return get<BadgeCollectionItem[]>(`/api/badges/collection?learnerId=${encodeURIComponent(learnerId)}`)
  },

  getDefinitions: async (_householdId: string): Promise<ApiResponse<BadgeDefinition[]>> => {
    return get<BadgeDefinition[]>('/api/badges/definitions')
  },

  getAwards: async (_householdId: string, learnerId: string): Promise<ApiResponse<BadgeAward[]>> => {
    return get<BadgeAward[]>(`/api/badges/awards?learnerId=${encodeURIComponent(learnerId)}`)
  },

  getSettings: async (_householdId: string): Promise<ApiResponse<BadgeSettings>> => {
    return get<BadgeSettings>('/api/badges/settings')
  },

  submitEvidence: async (
    awardId: string,
    evidenceId: string,
  ): Promise<ApiResponse<BadgeAward>> => {
    const res = await fetch(`${getApiBaseUrl()}/api/badges/awards/${encodeURIComponent(awardId)}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evidenceId }),
    })
    if (!res.ok) throw new Error(`Request failed: ${res.status}`)
    return res.json()
  },
}
