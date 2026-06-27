import type { BadgeDefinition, BadgeAward, BadgeCollectionItem, BadgeSettings } from '@/features/badges/types'

/**
 * Returns badge definitions visible to the household (starter + custom).
 * badge_definitions table created in Layer 3; returns [] until then.
 */
export async function listBadgeDefinitions(
  _householdId: string,
): Promise<BadgeDefinition[]> {
  return []
}

/**
 * Returns the badge collection (definitions + earned state) for a learner.
 * badge_awards table created in Layer 3; returns [] until then.
 */
export async function listBadgeCollection(
  _householdId: string,
  _learnerId: string,
): Promise<BadgeCollectionItem[]> {
  return []
}

/**
 * Returns all badge awards for a learner.
 * badge_awards table created in Layer 3; returns [] until then.
 */
export async function listBadgeAwards(
  _householdId: string,
  _learnerId: string,
): Promise<BadgeAward[]> {
  return []
}

/**
 * Returns household badge settings.
 * badge_settings table created in Layer 3; returns defaults until then.
 */
export async function getBadgeSettings(
  householdId: string,
): Promise<BadgeSettings> {
  return { householdId, platformBadgesEnabled: true }
}
