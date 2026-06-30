import type { ApiResponse } from '@/features/lib/types'
import type { BadgeDefinition, BadgeAward, BadgeAwardEvidence, BadgeCollectionItem, BadgeSettings } from '@/features/badges/types'

/** Award lifecycle transitions the UI can request. */
export type AwardTransition = 'submitted' | 'verified' | 'approved'

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return `http://127.0.0.1:${process.env.PORT ?? '3000'}`
}

async function get<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

async function mutate<T>(path: string, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', body?: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
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

  createAward: async (learnerId: string, badgeId: string): Promise<ApiResponse<BadgeAward | null>> => {
    return mutate<BadgeAward | null>('/api/badges/awards', 'POST', { learnerId, badgeId })
  },

  advanceAward: async (awardId: string, status: AwardTransition): Promise<ApiResponse<BadgeAward | null>> => {
    return mutate<BadgeAward | null>(`/api/badges/awards/${encodeURIComponent(awardId)}`, 'PATCH', { status })
  },

  deleteAward: async (awardId: string): Promise<ApiResponse<null>> => {
    return mutate<null>(`/api/badges/awards/${encodeURIComponent(awardId)}`, 'DELETE')
  },

  addEvidence: async (awardId: string, evidenceId: string): Promise<ApiResponse<BadgeAwardEvidence | null>> => {
    return mutate<BadgeAwardEvidence | null>(`/api/badges/awards/${encodeURIComponent(awardId)}/evidence`, 'POST', { evidenceId })
  },

  removeEvidence: async (awardId: string, evidenceLinkId: string): Promise<ApiResponse<null>> => {
    return mutate<null>(`/api/badges/awards/${encodeURIComponent(awardId)}/evidence/${encodeURIComponent(evidenceLinkId)}`, 'DELETE')
  },

  setSettings: async (platformBadgesEnabled: boolean): Promise<ApiResponse<BadgeSettings | null>> => {
    return mutate<BadgeSettings | null>('/api/badges/settings', 'PUT', { platformBadgesEnabled })
  },

  /** Backwards-compatible alias — now backed by a real route. */
  submitEvidence: async (awardId: string, evidenceId: string): Promise<ApiResponse<BadgeAwardEvidence | null>> => {
    return mutate<BadgeAwardEvidence | null>(`/api/badges/awards/${encodeURIComponent(awardId)}/evidence`, 'POST', { evidenceId })
  },
}
