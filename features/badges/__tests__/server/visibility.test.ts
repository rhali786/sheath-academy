import { filterDefinitionsBySettings } from '@/features/badges/server/visibility'
import type { BadgeDefinition, BadgeSettings } from '@/features/badges/types'

function makeDefinition(overrides: Partial<BadgeDefinition> = {}): BadgeDefinition {
  return {
    id: 'badge_1',
    householdId: null,
    title: 'Starter Badge',
    description: 'desc',
    criteria: 'criteria',
    emblemKey: 'starter',
    gradeBands: [],
    verificationRequirement: 'none',
    isStarter: true,
    enabled: true,
    visibility: 'platform',
    ...overrides,
  }
}

const platformBadge = makeDefinition({ id: 'platform_1', householdId: null, isStarter: true })
const householdBadge = makeDefinition({
  id: 'household_1',
  householdId: 'hh_1',
  isStarter: false,
  visibility: 'household',
})

describe('filterDefinitionsBySettings', () => {
  it('returns all definitions when platformBadgesEnabled is true', () => {
    const settings: BadgeSettings = { householdId: 'hh_1', platformBadgesEnabled: true }
    const result = filterDefinitionsBySettings([platformBadge, householdBadge], settings)
    expect(result).toEqual([platformBadge, householdBadge])
  })

  it('excludes platform (householdId null) definitions when platformBadgesEnabled is false', () => {
    const settings: BadgeSettings = { householdId: 'hh_1', platformBadgesEnabled: false }
    const result = filterDefinitionsBySettings([platformBadge, householdBadge], settings)
    expect(result).toEqual([householdBadge])
  })

  it('keeps household-owned definitions even when platformBadgesEnabled is false', () => {
    const settings: BadgeSettings = { householdId: 'hh_1', platformBadgesEnabled: false }
    const result = filterDefinitionsBySettings([householdBadge], settings)
    expect(result).toEqual([householdBadge])
  })

  it('returns an empty array when only platform badges exist and they are disabled', () => {
    const settings: BadgeSettings = { householdId: 'hh_1', platformBadgesEnabled: false }
    const result = filterDefinitionsBySettings([platformBadge], settings)
    expect(result).toEqual([])
  })
})
