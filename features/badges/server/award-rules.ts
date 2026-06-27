import type { CanAwardInput, CanAwardResult } from '@/features/badges/types'

/**
 * Gate function for badge approval.
 * Status cannot reach approved without evidence + submission + verification (when required).
 */
export function canAward(input: CanAwardInput): CanAwardResult {
  const { award, definition } = input
  const reasons: string[] = []

  if (award.approvedAt) {
    return { allowed: false, blockedReasons: ['Award is already approved'] }
  }

  if (!award.evidenceIds || award.evidenceIds.length === 0) {
    reasons.push('At least one evidence item is required')
  }

  if (award.status === 'draft') {
    reasons.push('Award must be submitted before approval')
  }

  if (
    definition.verificationRequirement !== 'none' &&
    award.status !== 'draft' &&
    !award.verifiedAt
  ) {
    reasons.push('Award must be verified before approval')
  }

  return {
    allowed: reasons.length === 0,
    blockedReasons: reasons,
  }
}
