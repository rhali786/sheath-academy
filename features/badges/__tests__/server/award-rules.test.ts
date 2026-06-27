import { canAward } from '@/features/badges/server/award-rules'
import type { CanAwardInput } from '@/features/badges/types'

function makeInput(overrides: Partial<CanAwardInput['award']> = {}, req: CanAwardInput['definition']['verificationRequirement'] = 'none'): CanAwardInput {
  return {
    award: {
      status: 'draft',
      evidenceIds: [],
      submittedAt: null,
      verifiedAt: null,
      approvedAt: null,
      ...overrides,
    },
    definition: { verificationRequirement: req },
  }
}

describe('canAward', () => {
  it('blocks when there is no evidence', () => {
    const result = canAward(makeInput({ evidenceIds: [] }))
    expect(result.allowed).toBe(false)
    expect(result.blockedReasons).toContain('At least one evidence item is required')
  })

  it('blocks when status is draft', () => {
    const result = canAward(makeInput({ evidenceIds: ['ev1'], status: 'draft' }))
    expect(result.allowed).toBe(false)
    expect(result.blockedReasons).toContain('Award must be submitted before approval')
  })

  it('blocks when submitted but not verified (requires parent verification)', () => {
    const result = canAward(makeInput({
      evidenceIds: ['ev1'],
      status: 'submitted',
      submittedAt: '2026-06-01',
      verifiedAt: null,
      approvedAt: null,
    }, 'parent'))
    expect(result.allowed).toBe(false)
    expect(result.blockedReasons).toContain('Award must be verified before approval')
  })

  it('allows when submitted + verified + verification=parent', () => {
    const result = canAward(makeInput({
      evidenceIds: ['ev1'],
      status: 'submitted',
      submittedAt: '2026-06-01',
      verifiedAt: '2026-06-02',
      approvedAt: null,
    }, 'parent'))
    expect(result.allowed).toBe(true)
    expect(result.blockedReasons).toHaveLength(0)
  })

  it('allows when submitted + no verification required (none)', () => {
    const result = canAward(makeInput({
      evidenceIds: ['ev1'],
      status: 'submitted',
      submittedAt: '2026-06-01',
      verifiedAt: null,
      approvedAt: null,
    }, 'none'))
    expect(result.allowed).toBe(true)
  })

  it('blocks when already approved (idempotency guard)', () => {
    const result = canAward(makeInput({
      evidenceIds: ['ev1'],
      status: 'verified',
      submittedAt: '2026-06-01',
      verifiedAt: '2026-06-02',
      approvedAt: '2026-06-03',
    }, 'none'))
    expect(result.allowed).toBe(false)
    expect(result.blockedReasons).toContain('Award is already approved')
  })
})
