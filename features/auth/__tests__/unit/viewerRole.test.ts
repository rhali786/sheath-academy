import { isLearnerSession } from '@/features/auth/front/viewerRole'

// The browser's view of the same role the server enforces (requireAuthCtx → ctx.role):
// the membership for the household the session is signed in to.
function session(role: string | undefined, householdId = 'hh_a') {
  return {
    user: {
      email: 'x@example.com',
      householdId,
      memberships: role ? [{ householdId: 'hh_a', householdName: 'Barakah Academy', role }] : [],
    },
    expires: '2099-01-01',
  }
}

describe('isLearnerSession', () => {
  it('is true for a learner membership in the current household', () => {
    expect(isLearnerSession(session('learner'))).toBe(true)
  })

  it('is false for an owner, a member or a teacher', () => {
    expect(isLearnerSession(session('owner'))).toBe(false)
    expect(isLearnerSession(session('member'))).toBe(false)
    expect(isLearnerSession(session('teacher'))).toBe(false)
  })

  it('is false with no session or no memberships', () => {
    expect(isLearnerSession(null)).toBe(false)
    expect(isLearnerSession(undefined)).toBe(false)
    expect(isLearnerSession(session(undefined))).toBe(false)
  })

  it('reads the membership of the household the session is signed in to', () => {
    expect(isLearnerSession(session('learner', 'hh_other'))).toBe(false)
  })
})
