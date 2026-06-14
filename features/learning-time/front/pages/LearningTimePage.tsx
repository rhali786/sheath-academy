'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import { NowCard } from '@/features/learning-time/front/components/NowCard'
import { SessionHistoryList } from '@/features/learning-time/front/components/SessionHistoryList'

export function LearningTimePage() {
  const { studentProfiles: children } = useHousehold()
  const searchParams = useSearchParams()
  const { selectedChildId, setSelectedChildId } = useLearner()

  const activeChildren = children.filter(c => c.isActive)

  // Seed shared learner selection from ?childId= when present; otherwise default to the first learner.
  useEffect(() => {
    if (activeChildren.length === 0) return
    const urlChildId = searchParams.get('childId')
    const matched = urlChildId ? activeChildren.find(c => c.id === urlChildId) : null
    if (matched) {
      setSelectedChildId(matched.id)
    } else if (!selectedChildId || !activeChildren.some(c => c.id === selectedChildId)) {
      setSelectedChildId(activeChildren[0].id)
    }
  }, [searchParams, activeChildren, selectedChildId, setSelectedChildId])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <h1 className="page-title">Learning Time</h1>

      {activeChildren.length === 0 ? (
        <p className="text-sm text-slate-500" data-testid="learning-time-empty">
          No active children. Add one to get started.
        </p>
      ) : (
        <>
          <div className="max-w-xs">
            <label htmlFor="learning-time-learner" className="block text-sm font-medium text-slate-700 mb-1">Learner</label>
            <select
              id="learning-time-learner"
              data-testid="learner-select"
              value={selectedChildId ?? ''}
              onChange={e => setSelectedChildId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              {activeChildren.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {selectedChildId && (
            <>
              <NowCard learnerId={selectedChildId} />
              <SessionHistoryList learnerId={selectedChildId} />
            </>
          )}
        </>
      )}
    </div>
  )
}
