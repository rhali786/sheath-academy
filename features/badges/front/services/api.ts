import type { ApiResponse } from '@/features/lib/types'
import type { BadgeDefinition, BadgeAward, BadgeCollectionItem, BadgeSettings } from '@/features/badges/types'
import { mockBadgeCollection, mockBadgeDefinitions, mockBadgeAwards } from '@/features/badges/__tests__/fixtures/mockBadges'

function ok<T>(data: T): ApiResponse<T> {
  return { status: 'success', data, message: 'ok', timestamp: new Date().toISOString() }
}

function tick(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

export const badgesApi = {
  /** Returns the badge collection (definitions + earned state) for a learner. */
  getCollection: async (_householdId: string, _learnerId: string): Promise<ApiResponse<BadgeCollectionItem[]>> => {
    await tick()
    return ok(mockBadgeCollection)
  },

  /** Returns all badge definitions visible to the household. */
  getDefinitions: async (_householdId: string): Promise<ApiResponse<BadgeDefinition[]>> => {
    await tick()
    return ok(mockBadgeDefinitions)
  },

  /** Returns all awards for a learner. */
  getAwards: async (_householdId: string, _learnerId: string): Promise<ApiResponse<BadgeAward[]>> => {
    await tick()
    return ok(mockBadgeAwards)
  },

  /** Returns household badge settings. */
  getSettings: async (_householdId: string): Promise<ApiResponse<BadgeSettings>> => {
    await tick()
    return ok({ householdId: _householdId, platformBadgesEnabled: true })
  },

  /** Submits evidence for a badge award (Layer 1: no-op stub). */
  submitEvidence: async (
    _awardId: string,
    _evidenceId: string,
  ): Promise<ApiResponse<BadgeAward>> => {
    await tick()
    return ok(mockBadgeAwards[0])
  },
}
