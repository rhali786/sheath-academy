import type { BadgeDefinition, BadgeSettings } from '@/features/badges/types'

/**
 * Applies the household's "platform badges enabled" setting to a list of
 * visible badge definitions. When disabled, platform (starter) badges —
 * householdId null — are excluded; the household's own custom badges are
 * never affected by this setting.
 */
export function filterDefinitionsBySettings(
  definitions: BadgeDefinition[],
  settings: BadgeSettings,
): BadgeDefinition[] {
  if (settings.platformBadgesEnabled) return definitions
  return definitions.filter((d) => d.householdId !== null)
}
