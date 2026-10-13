'use client'

import { useEffect } from 'react'
import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import { useIsLearner } from '@/features/auth/front/viewerRole'

/**
 * A learner login is always looking at themselves. The server gives a learner's shell only
 * their own profile (learnerPolicy pins /children/children), so the picker hides itself;
 * this makes the selection match — including over a sibling a parent left selected in the
 * same browser tab. Without it pages fell back to the first child, a sibling, and were
 * refused (UAT 8.3, 2026-10-12). Renders nothing.
 */
export function LearnerSelfSelect() {
  const isLearner = useIsLearner()
  const { studentProfiles, loading } = useHousehold()
  const { selectedChildId, setSelectedChildId } = useLearner()
  const ownId = isLearner && !loading && studentProfiles.length === 1 ? studentProfiles[0].id : null

  useEffect(() => {
    if (ownId && selectedChildId !== ownId) setSelectedChildId(ownId)
  }, [ownId, selectedChildId, setSelectedChildId])

  return null
}
