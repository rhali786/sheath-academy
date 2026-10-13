'use client'

import { useSession } from 'next-auth/react'
import type { Session } from 'next-auth'

/**
 * Whether the signed-in person is a learner in the household they are signed in to.
 * The same role the server enforces (requireAuthCtx → ctx.role → learnerPolicy); the
 * browser only uses it to choose what to show, never to grant access.
 */
export function isLearnerSession(session: Session | null | undefined): boolean {
  const user = session?.user
  if (!user?.householdId) return false
  return user.memberships?.find(m => m.householdId === user.householdId)?.role === 'learner'
}

/** `isLearner` once the session is known; `known` is false while it loads. */
export function useViewerRole(): { isLearner: boolean; known: boolean } {
  const { data, status } = useSession()
  return { isLearner: isLearnerSession(data), known: status !== 'loading' }
}

export function useIsLearner(): boolean {
  return useViewerRole().isLearner
}
