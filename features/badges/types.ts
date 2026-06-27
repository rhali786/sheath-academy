import type { GradeBand } from '@/features/gradebook/types'

export type BadgeStatus = 'draft' | 'submitted' | 'verified'
export type VerificationRequirement = 'none' | 'parent' | 'external'
export type BadgeVisibility = 'household' | 'platform'

export interface BadgeDefinition {
  id: string
  /** null = starter badge (platform-wide); non-null = household custom */
  householdId: string | null
  title: string
  description: string
  criteria: string
  emblemKey: string
  gradeBands: GradeBand[]
  verificationRequirement: VerificationRequirement
  isStarter: boolean
  enabled: boolean
  visibility: BadgeVisibility
}

export interface BadgeAward {
  id: string
  householdId: string
  learnerId: string
  badgeId: string
  status: BadgeStatus
  submittedAt: string | null
  verifiedAt: string | null
  approvedAt: string | null
  /** Evidence items supporting this award */
  evidenceIds: string[]
}

export interface BadgeAwardEvidence {
  id: string
  householdId: string
  badgeAwardId: string
  evidenceId: string
  addedAt: string
}

export interface AutonomyUnlock {
  id: string
  householdId: string
  learnerId: string
  badgeId: string
  unlockedAt: string
  grantedBy: string
}

export interface BadgeSettings {
  householdId: string
  platformBadgesEnabled: boolean
}

// ─── Award-flow guard ─────────────────────────────────────────────────────────

export interface CanAwardInput {
  award: Pick<BadgeAward, 'status' | 'evidenceIds' | 'submittedAt' | 'verifiedAt' | 'approvedAt'>
  definition: Pick<BadgeDefinition, 'verificationRequirement'>
}

export interface CanAwardResult {
  allowed: boolean
  blockedReasons: string[]
}

// ─── Badge collection for UI ──────────────────────────────────────────────────

export interface BadgeCollectionItem {
  definition: BadgeDefinition
  award: BadgeAward | null
  isEarned: boolean
}
