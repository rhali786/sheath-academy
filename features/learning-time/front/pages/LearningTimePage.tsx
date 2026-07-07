'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import { NowCard } from '@/features/learning-time/front/components/NowCard'
import { SessionHistoryList } from '@/features/learning-time/front/components/SessionHistoryList'

export function LearningTimePage() {
  const { studentProfiles: children, allSubjects } = useHousehold()
  const searchParams = useSearchParams()
  const { selectedChildId, setSelectedChildId } = useLearner()
  const [selectedCourseId, setSelectedCourseId] = useState('')

  const activeChildren = children.filter(c => c.isActive)
  const activeSubjects = allSubjects.filter(s => s.isActive !== false)

  const selectedCourse = useMemo(
    () => activeSubjects.find(s => s.id === selectedCourseId) ?? null,
    [activeSubjects, selectedCourseId],
  )

  const filteredChildren = selectedCourse
    ? activeChildren.filter(c => selectedCourse.learnerIds.includes(c.id))
    : activeChildren

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

  // Keep the learner selection valid whenever the course narrows the eligible list.
  useEffect(() => {
    if (filteredChildren.length === 0) return
    if (!selectedChildId || !filteredChildren.some(c => c.id === selectedChildId)) {
      setSelectedChildId(filteredChildren[0].id)
    }
  }, [filteredChildren, selectedChildId, setSelectedChildId])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <h1 className="page-title">Learning Time</h1>

      {activeChildren.length === 0 ? (
        <p className="text-sm text-slate-500" data-testid="learning-time-empty">
          No active children. Add one to get started.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-4">
            <div className="max-w-xs">
              <label htmlFor="learning-time-course" className="block text-sm font-medium text-slate-700 mb-1">Course (optional)</label>
              <select
                id="learning-time-course"
                data-testid="course-select"
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              >
                <option value="">All courses</option>
                {activeSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="max-w-xs">
              <label htmlFor="learning-time-learner" className="block text-sm font-medium text-slate-700 mb-1">Learner</label>
              <select
                id="learning-time-learner"
                data-testid="learner-select"
                value={selectedChildId ?? ''}
                onChange={e => setSelectedChildId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              >
                {filteredChildren.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedChildId && (
            <>
              <NowCard learnerId={selectedChildId} initialSubjectId={selectedCourseId || undefined} />
              <SessionHistoryList learnerId={selectedChildId} />
            </>
          )}
        </>
      )}
    </div>
  )
}
