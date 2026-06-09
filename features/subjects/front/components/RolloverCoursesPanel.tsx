'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SchoolYear } from '@/features/school-year/types'
import type { SubjectCourse } from '@/features/subjects/types'
import { schoolYearApi } from '@/features/school-year/front/services/api'
import { subjectsApi } from '@/features/subjects/front/services/api'
import { InlineConfirm } from '@/features/lib/front/components/InlineConfirm'

interface Props {
  householdId: string
  activeYear: SchoolYear
}

export function RolloverCoursesPanel({ householdId, activeYear }: Props) {
  const [years, setYears] = useState<SchoolYear[]>([])
  const [courses, setCourses] = useState<SubjectCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [targetYearId, setTargetYearId] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const targetYears = useMemo(
    () => years.filter((y) => y.id !== activeYear.id),
    [years, activeYear.id],
  )

  const targetYear = targetYears.find((y) => y.id === targetYearId)

  const loadData = useCallback(async () => {
    if (!householdId) return
    setLoading(true)
    setLoadError(null)
    try {
      const [yearsRes, coursesRes] = await Promise.all([
        schoolYearApi.getSchoolYears(),
        subjectsApi.getSubjects(),
      ])
      setYears(yearsRes.data ?? [])
      const activeCourses = (coursesRes.data ?? []).filter((c) => c.isActive)
      setCourses(activeCourses)
      setSelectedIds(new Set(activeCourses.map((c) => c.id)))
    } catch {
      setLoadError('Could not load school years or courses.')
    } finally {
      setLoading(false)
    }
  }, [householdId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (targetYears.length > 0 && !targetYearId) {
      setTargetYearId(targetYears[0].id)
    }
  }, [targetYears, targetYearId])

  function toggleCourse(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSuccessMessage(null)
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(courses.map((c) => c.id)) : new Set())
    setSuccessMessage(null)
  }

  async function handleConfirmRollover() {
    if (!targetYear) return
    setRolling(true)
    setActionError(null)
    try {
      const res = await subjectsApi.rolloverCourses({
        fromYearId: activeYear.id,
        toYearId: targetYear.id,
        courseIds: [...selectedIds],
      })
      if (res.status !== 'success') {
        throw new Error(res.message || 'Rollover failed')
      }
      setSuccessMessage(
        `Rolled over ${selectedIds.size} course${selectedIds.size === 1 ? '' : 's'} to ${targetYear.name}.`,
      )
      setConfirmOpen(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Rollover failed. Please try again.')
      throw err
    } finally {
      setRolling(false)
    }
  }

  if (loading) {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4" data-testid="rollover-panel-loading">
        <p className="text-sm text-slate-500">Loading course rollover…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4" data-testid="rollover-panel-error">
        <p className="text-sm text-red-700">{loadError}</p>
      </div>
    )
  }

  if (targetYears.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4" data-testid="rollover-panel-empty">
        <h3 className="text-sm font-semibold text-slate-900">Roll over courses</h3>
        <p className="mt-2 text-sm text-slate-600">
          Create your next school year above first, then you can copy courses from{' '}
          <span className="font-medium">{activeYear.name}</span> into it.
        </p>
      </div>
    )
  }

  const selectedCount = selectedIds.size
  const allSelected = courses.length > 0 && selectedCount === courses.length

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 space-y-4" data-testid="rollover-panel">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Roll over courses</h3>
        <p className="mt-1 text-sm text-slate-500">
          Copy courses from <span className="font-medium text-slate-700">{activeYear.name}</span> into
          another school year. Lessons stay on the original year&apos;s courses.
        </p>
      </div>

      {successMessage && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2" role="status">
          {successMessage}
        </p>
      )}

      <div>
        <label htmlFor="rollover-target-year" className="block text-xs font-medium text-slate-600 mb-1">
          Target school year
        </label>
        <select
          id="rollover-target-year"
          value={targetYearId}
          onChange={(e) => {
            setTargetYearId(e.target.value)
            setSuccessMessage(null)
          }}
          className="w-full max-w-md text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
        >
          {targetYears.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name} ({y.startDate} → {y.endDate})
            </option>
          ))}
        </select>
      </div>

      {courses.length === 0 ? (
        <p className="text-sm text-slate-500">No active courses in {activeYear.name} to roll over.</p>
      ) : (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => toggleAll(e.target.checked)}
              className="rounded border-slate-300"
            />
            Select all ({courses.length})
          </label>
          <ul className="max-h-48 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100">
            {courses.map((course) => (
              <li key={course.id} className="px-3 py-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(course.id)}
                    onChange={() => toggleCourse(course.id)}
                    className="rounded border-slate-300"
                  />
                  {course.name}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirmOpen && targetYear ? (
        <InlineConfirm
          message={`Roll over ${selectedCount} course${selectedCount === 1 ? '' : 's'} from ${activeYear.name} to ${targetYear.name}?`}
          detail="This creates duplicate course rows in the target year. Original courses and their lessons are not changed."
          confirmLabel="Roll over"
          pendingLabel="Rolling over…"
          tone="warning"
          onConfirm={handleConfirmRollover}
          onCancel={() => {
            setConfirmOpen(false)
            setActionError(null)
          }}
        />
      ) : (
        <button
          type="button"
          disabled={!targetYear || selectedCount === 0 || rolling}
          onClick={() => {
            setActionError(null)
            setConfirmOpen(true)
          }}
          className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
        >
          Roll over courses to {targetYear?.name ?? '…'}
        </button>
      )}

      {actionError && !confirmOpen && (
        <p className="text-sm text-red-600" role="alert">
          {actionError}
        </p>
      )}
    </div>
  )
}
