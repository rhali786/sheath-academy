'use client'

import { useLearner } from '@/features/layout/front/context/LearnerContext'

/** @deprecated Prefer useLearner() from layout. Kept for tests and gradual migration. */
export function useSelectedChild(): [string | null, (id: string | null) => void] {
  const { selectedChildId, setSelectedChildId } = useLearner()
  return [selectedChildId, setSelectedChildId]
}
