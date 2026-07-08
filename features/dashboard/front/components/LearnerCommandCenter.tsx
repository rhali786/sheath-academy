'use client'

import { useEffect, useState } from 'react'
import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import { useActiveSchoolYear } from '@/features/school-year/front/context/ActiveSchoolYearContext'
import { attendanceApi } from '@/features/attendance/front/services/api'
import { plannerApi } from '@/features/plan/front/services/api'
import { gradebookApi } from '@/features/gradebook/front/services/api'
import { LearnerCommandRow, LEARNER_ROW_GRID, type LearnerCommandRowMetrics } from './LearnerCommandRow'

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const EMPTY_METRICS: LearnerCommandRowMetrics = {
  attendancePercent: null,
  lessonsCompleted: 0,
  lessonsTotal: 0,
  currentGrade: null,
}

export function LearnerCommandCenter() {
  const { studentProfiles, loading: householdLoading, error: householdError } = useHousehold()
  const { setSelectedChildId } = useLearner()
  const { activeSchoolYear, loading: activeSchoolYearLoading } = useActiveSchoolYear()
  const [metricsByChild, setMetricsByChild] = useState<Record<string, LearnerCommandRowMetrics>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const activeLearners = studentProfiles.filter(s => s.isActive)
  const activeLearnerIds = activeLearners.map(l => l.id).join(',')

  useEffect(() => {
    if (householdLoading || activeSchoolYearLoading) return

    if (activeLearnerIds === '') {
      setMetricsByChild({})
      setLoading(false)
      setError(false)
      return
    }

    let active = true
    setLoading(true)
    setError(false)
    const learners = activeLearnerIds.split(',')
    const today = todayIso()

    const load = async () => {
      try {
        const activeYearStart = activeSchoolYear?.startDate
        // The "active" school year can be next year's, already set up mid-summer before
        // today falls inside its range — a startDate after today would make a start..today
        // window inverted (always empty), so fall back to no lower bound in that case.
        const yearStart = activeYearStart && activeYearStart <= today ? activeYearStart : undefined
        const [gradebookRes, ...perChild] = await Promise.all([
          gradebookApi.getSummaries(''),
          ...learners.flatMap(childId => [
            attendanceApi.getSummary(childId, yearStart, today),
            plannerApi.getLessons(undefined, [childId], undefined, today, today),
          ]),
        ])
        if (!active) return

        const summaries = gradebookRes.data
        const next: Record<string, LearnerCommandRowMetrics> = {}

        learners.forEach((childId, i) => {
          const attendanceSummary = perChild[i * 2] as Awaited<ReturnType<typeof attendanceApi.getSummary>>
          const lessons = perChild[i * 2 + 1] as Awaited<ReturnType<typeof plannerApi.getLessons>>
          const summary = summaries.find(s => s.learnerId === childId)

          const totalRecorded = attendanceSummary.data.totalRecorded
          const attendancePercent = totalRecorded === 0
            ? null
            : Math.round((attendanceSummary.data.byStatus.present / totalRecorded) * 100)

          const lessonsTotal = lessons.length
          const lessonsCompleted = lessons.filter(l => l.status === 'completed').length

          next[childId] = {
            attendancePercent,
            lessonsCompleted,
            lessonsTotal,
            currentGrade: summary?.overallMastery ?? null,
          }
        })

        setMetricsByChild(next)
        setLoading(false)
      } catch {
        if (active) {
          setError(true)
          setLoading(false)
        }
      }
    }

    void load()
    return () => { active = false }
  }, [householdLoading, activeLearnerIds, activeSchoolYearLoading, activeSchoolYear?.startDate])

  if (householdLoading || loading) {
    return (
      <section className="rounded-xl border bg-white p-4 divide-y" data-testid="learner-command-center-loading">
        <div className="space-y-2 animate-pulse py-2">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
        </div>
      </section>
    )
  }

  if (householdError || error) {
    return (
      <section className="rounded-xl border bg-white p-4 text-sm text-gray-400" data-testid="learner-command-center-error">
        Couldn&apos;t load learner summaries.
      </section>
    )
  }

  if (activeLearners.length === 0) {
    return (
      <section className="rounded-xl border bg-white p-4 text-sm text-gray-400" data-testid="learner-command-center-empty">
        No active learners yet.
      </section>
    )
  }

  return (
    <section className="rounded-xl border bg-white divide-y" data-testid="learner-command-center">
      <div
        className={`${LEARNER_ROW_GRID} px-4 py-3 text-[10.5px] font-bold uppercase tracking-wide text-slate-400`}
        data-testid="learner-command-header"
      >
        <span>Learner</span>
        <span>Attendance</span>
        <span>Lessons Due Today</span>
        <span>Current grade</span>
        <span></span>
      </div>
      {activeLearners.map((learner, i) => (
        <LearnerCommandRow
          key={learner.id}
          learner={learner}
          metrics={metricsByChild[learner.id] ?? EMPTY_METRICS}
          onSelect={setSelectedChildId}
          colorIndex={i}
        />
      ))}
    </section>
  )
}
