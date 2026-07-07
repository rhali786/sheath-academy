'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import { schoolYearApi } from '@/features/school-year/front/services/api'
import { NowCard } from '@/features/learning-time/front/components/NowCard'
import { SessionHistoryList } from '@/features/learning-time/front/components/SessionHistoryList'
import type { SubjectCourse } from '@/features/subjects/types'

export function LearningTimePage() {
  const { studentProfiles: children, allSubjects } = useHousehold()
  const searchParams = useSearchParams()
  const { selectedChildId, setSelectedChildId } = useLearner()
  const [selectedCourseName, setSelectedCourseName] = useState('')
  const [activeSchoolYearId, setActiveSchoolYearId] = useState<string | null>(null)

  useEffect(() => {
    schoolYearApi.getActiveSchoolYear()
      .then(res => setActiveSchoolYearId(res.data?.id ?? null))
      .catch(() => setActiveSchoolYearId(null))
  }, [])

  const activeChildren = children.filter(c => c.isActive)
  // Rollover clones a course into the new school year but leaves the source row active too,
  // so the same course name can legitimately appear more than once — keep only the current year's copy.
  const activeSubjects = allSubjects.filter(
    s => s.isActive !== false && (!activeSchoolYearId || !s.schoolYearId || s.schoolYearId === activeSchoolYearId),
  )

  // Existing data can have one course row per learner sharing the same name (e.g. seed data
  // creates a separate "Mathematics" row per child instead of one shared row with multiple
  // learnerIds). Group by name so the dropdown shows each course once regardless of how the
  // underlying rows are split, and narrow the Learner list by the union of their learnerIds.
  const courseGroups = useMemo(() => {
    const map = new Map<string, SubjectCourse[]>()
    for (const s of activeSubjects) {
      const list = map.get(s.name) ?? []
      list.push(s)
      map.set(s.name, list)
    }
    return map
  }, [activeSubjects])

  const courseNames = useMemo(() => Array.from(courseGroups.keys()), [courseGroups])
  const selectedCourseMembers = selectedCourseName ? courseGroups.get(selectedCourseName) ?? [] : []

  const filteredChildren = selectedCourseName
    ? activeChildren.filter(c => selectedCourseMembers.some(m => m.learnerIds.includes(c.id)))
    : activeChildren

  // Derived synchronously (not via effect): whenever the course narrows the eligible list,
  // this is already correct on the very same render — nothing downstream (the Lesson fetch
  // in NowCard) can ever see a learner who isn't valid for the selected course.
  const effectiveChildId = selectedChildId && filteredChildren.some(c => c.id === selectedChildId)
    ? selectedChildId
    : filteredChildren[0]?.id ?? null

  // Once a specific learner is resolved, find which single underlying row is actually theirs —
  // that's what gets passed to NowCard for the Lesson list and the session's course tag.
  const resolvedCourse = useMemo(() => {
    if (!selectedCourseName || !effectiveChildId) return null
    const member = selectedCourseMembers.find(m => m.learnerIds.includes(effectiveChildId))
    return member ? { id: member.id, name: member.name } : null
  }, [selectedCourseName, effectiveChildId, selectedCourseMembers])

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

  // Persist the course-corrected learner into the shared cross-page context in the background.
  // This is not load-bearing for this page's own rendering/fetching — effectiveChildId already
  // reflects the correction synchronously — it only keeps other pages/URLs in sync.
  useEffect(() => {
    if (effectiveChildId && effectiveChildId !== selectedChildId) {
      setSelectedChildId(effectiveChildId)
    }
  }, [effectiveChildId, selectedChildId, setSelectedChildId])

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
                value={selectedCourseName}
                onChange={e => setSelectedCourseName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              >
                <option value="">All courses</option>
                {courseNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <p data-testid="course-select-hint" className="text-xs text-slate-400 mt-1">
                Only learners enrolled in this course are shown below.
              </p>
            </div>

            <div className="max-w-xs">
              <label htmlFor="learning-time-learner" className="block text-sm font-medium text-slate-700 mb-1">Learner</label>
              <select
                id="learning-time-learner"
                data-testid="learner-select"
                value={effectiveChildId ?? ''}
                onChange={e => setSelectedChildId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              >
                {filteredChildren.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {effectiveChildId && (
            <>
              <NowCard
                learnerId={effectiveChildId}
                course={resolvedCourse ?? undefined}
                allSubjects={activeSubjects}
              />
              <SessionHistoryList learnerId={effectiveChildId} />
            </>
          )}
        </>
      )}
    </div>
  )
}
