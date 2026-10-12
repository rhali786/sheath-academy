'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { plannerApi } from '@/features/plan/front/services/api'
import { LessonTaskForm, type LessonFormData } from '@/features/plan/front/components/LessonTaskForm'
import { LessonTaskList } from '@/features/plan/front/components/LessonTaskList'
import type { LessonTask, LessonTaskPatch } from '@/features/plan/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'
import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import { TodayLessonCard } from '@/features/plan/front/components/TodayLessonCard'
import { InlineSuccess } from '@/features/lib/front/components/InlineSuccess'
import { matchesStatusFilter, type LessonStatusFilter } from '@/features/plan/utils/lessonStatusFilter'
import { LESSON_LIST_RANGES, lessonRangeStart, type LessonListRange } from '@/features/plan/utils/lessonListRange'

function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

type DateSort = 'asc' | 'desc'

function chipClass(active: boolean): string {
  return `px-3 py-1.5 text-sm font-medium rounded-full border focus:outline-none focus:ring-2 focus:ring-forest-900 ${
    active ? 'bg-forest-900 border-forest-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
  }`
}

export function LessonsPage() {
  const { householdProfile, studentProfiles: children, allSubjects: subjects } = useHousehold()
  const { selectedChildId } = useLearner()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [lessons, setLessons] = useState<LessonTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // Only the first load shows "Loading…". Later refreshes keep the list mounted, so an
  // open editor isn't torn down and a deep-linked one doesn't reopen after Save.
  const [hasLoaded, setHasLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters — learners and date range are applied by the server, so the page never
  // loads every lesson ever created. No learners selected = all children.
  const [filterChildIds, setFilterChildIds] = useState<string[]>(selectedChildId ? [selectedChildId] : [])
  const [range, setRange] = useState<LessonListRange>('week')
  const [filterStatus, setFilterStatus] = useState<LessonStatusFilter>('')
  const [dateSort, setDateSort] = useState<DateSort>('desc')
  const [showForm, setShowForm] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null)

  // Keep page filter in sync with header learner (null = All children)
  useEffect(() => {
    setFilterChildIds(selectedChildId ? [selectedChildId] : [])
  }, [selectedChildId])

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setShowForm(true)
    }
  }, [searchParams])

  const editingLessonId = searchParams.get('editId')

  // Make a deep-linked lesson visible: select its learner and widen the range if it is older.
  useEffect(() => {
    if (!editingLessonId) return
    let cancelled = false
    plannerApi.getLesson(editingLessonId).then(lesson => {
      if (cancelled || !lesson) return
      setFilterChildIds([lesson.childId])
      setRange(r => {
        const start = lessonRangeStart(r, todayLocal())
        return start && lesson.dueDate < start ? 'all' : r
      })
    }).catch(() => {})
    return () => { cancelled = true }
  }, [editingLessonId])

  // Scroll to the lesson card when opened from /plan
  useEffect(() => {
    if (!editingLessonId || isLoading) return
    const el = document.querySelector(`[data-lesson-id="${editingLessonId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [editingLessonId, isLoading, lessons])

  // Overdue means "anything past due", so it ignores the date range.
  const showsEveryDate = filterStatus === 'overdue'
  const startDate = showsEveryDate ? undefined : lessonRangeStart(range, todayLocal())
  const childKey = filterChildIds.join(',')

  // Filters change faster than responses arrive; only the latest request may set state.
  const latestRequest = useRef(0)
  const fetchLessons = useCallback(async () => {
    const request = ++latestRequest.current
    try {
      setIsLoading(true)
      setError(null)
      const list = await plannerApi.getLessons(undefined, childKey ? childKey.split(',') : undefined, undefined, startDate)
      if (request === latestRequest.current) { setLessons(list); setHasLoaded(true) }
    } catch {
      if (request === latestRequest.current) setError('Failed to load lessons')
    } finally {
      if (request === latestRequest.current) setIsLoading(false)
    }
  }, [childKey, startDate])

  useEffect(() => {
    fetchLessons()
  }, [fetchLessons])

  // The deep-linked editor closed (saved or cancelled): drop editId so it stays closed,
  // including on reload. Other params (e.g. ?add=1) are kept.
  function clearEditId() {
    if (!editingLessonId) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('editId')
    const rest = params.toString()
    router.replace(rest ? `/lessons?${rest}` : '/lessons')
  }

  function toggleChild(childId: string) {
    setFilterChildIds(prev => {
      const next = prev.includes(childId) ? prev.filter(id => id !== childId) : [...prev, childId]
      return children.map(c => c.id).filter(id => next.includes(id))
    })
  }

  const filtersNarrow = filterChildIds.length > 0 || filterStatus !== '' || startDate !== undefined

  const filteredLessons = useMemo(() => {
    const today = todayLocal()
    let list = lessons
    if (childKey) list = list.filter(l => childKey.split(',').includes(l.childId))
    list = list.filter(l => matchesStatusFilter(l, filterStatus, today))
    list = [...list].sort((a, b) => {
      const cmp = a.dueDate.localeCompare(b.dueDate)
      return dateSort === 'asc' ? cmp : -cmp
    })
    return list
  }, [lessons, childKey, filterStatus, dateSort])

  async function handleSubmit(data: LessonFormData) {
    const householdId = householdProfile?.id ?? ''
    await plannerApi.createLesson({ ...data, householdId })
    await fetchLessons()
    setShowForm(false)
    setSuccessMsg('Lesson added!')
  }

  async function handleUpdate(id: string, patch: LessonTaskPatch) {
    await plannerApi.updateLesson(id, patch)
    await fetchLessons()
  }

  // Errors propagate to the delete confirmation, which shows them and stays open.
  async function handleDelete(id: string, options: { deleteGroup: boolean }) {
    const lesson = lessons.find(l => l.id === id)
    const deleted = await plannerApi.deleteLesson(id, options)
    if (lesson) {
      const name = children.find(c => c.id === lesson.childId)?.name
      const who = options.deleteGroup
        ? (deleted > 1 ? ` for ${deleted} learners` : '')
        : (lesson.groupId && name ? ` for ${name}` : '')
      setDeleteNotice(`“${lesson.title}” deleted${who}`)
    }
    await fetchLessons()
  }

  async function handleComplete(id: string, status: 'completed') {
    await plannerApi.completeLesson(id, status)
    await fetchLessons()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {successMsg && (
        <div role="alert" className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {successMsg}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="page-title mb-0">Lessons</h1>
        <button
          type="button"
          onClick={() => { setShowForm(v => !v); setSuccessMsg(null) }}
          className="px-4 py-2 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800"
        >
          {showForm ? 'Cancel' : 'Add lesson'}
        </button>
      </div>
      {showForm && (
        <div>
          <h2 className="form-section-heading">Add lesson</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <LessonTaskForm
              children={children}
              subjects={subjects}
              defaultSelectedChildIds={selectedChildId ? [selectedChildId] : undefined}
              schoolDays={householdProfile?.schoolDays}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      )}

      {children.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Today</h2>
          <TodayLessonCard children={children} today={todayLocal()} externalLessons={lessons} />
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-slate-900">All lessons</h2>

          <div className="flex flex-wrap gap-2">
            {/* Date range */}
            <select
              aria-label="Date range"
              value={range}
              onChange={e => setRange(e.target.value as LessonListRange)}
              disabled={showsEveryDate}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-900 disabled:opacity-50"
            >
              {LESSON_LIST_RANGES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as LessonStatusFilter)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              <option value="">All statuses</option>
              <option value="not_started">Not started</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped</option>
            </select>

            {/* Date sort */}
            <select
              value={dateSort}
              onChange={e => setDateSort(e.target.value as DateSort)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              <option value="desc">Date: newest first</option>
              <option value="asc">Date: oldest first</option>
            </select>
          </div>
        </div>

        {deleteNotice && (
          <div className="mb-4">
            <InlineSuccess message={deleteNotice} onDismiss={() => setDeleteNotice(null)} />
          </div>
        )}

        {/* Learner filter — pick any number; none picked = all children */}
        {children.length > 1 && (
          <div role="group" aria-label="Filter by learner" className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              aria-pressed={filterChildIds.length === 0}
              onClick={() => setFilterChildIds([])}
              className={chipClass(filterChildIds.length === 0)}
            >
              All children
            </button>
            {children.map(c => (
              <button
                key={c.id}
                type="button"
                aria-pressed={filterChildIds.includes(c.id)}
                onClick={() => toggleChild(c.id)}
                className={chipClass(filterChildIds.includes(c.id))}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {showsEveryDate && (
          <p className="text-xs text-slate-500 -mt-2 mb-4">Overdue shows every date, not just the selected range.</p>
        )}

        {isLoading && !hasLoaded ? (
          <p className="text-sm text-slate-400 py-4">Loading…</p>
        ) : (
          <LessonTaskList
            lessons={filteredLessons}
            children={children}
            subjects={subjects}
            error={error}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onComplete={handleComplete}
            editingLessonId={editingLessonId}
            onEditEnd={clearEditId}
            emptyMessage={filtersNarrow ? 'No lessons match these filters. Try another learner or a wider date range.' : undefined}
          />
        )}
      </div>
    </div>
  )
}
