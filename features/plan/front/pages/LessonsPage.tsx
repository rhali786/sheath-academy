'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { plannerApi } from '@/features/plan/front/services/api'
import { LessonTaskForm, type LessonFormData } from '@/features/plan/front/components/LessonTaskForm'
import { LessonTaskList } from '@/features/plan/front/components/LessonTaskList'
import type { LessonTask, LessonTaskStatus } from '@/features/plan/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'
import { useHousehold } from '@/features/household/front/context'
import { TodayLessonCard } from '@/features/plan/front/components/TodayLessonCard'

function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

type DateSort = 'asc' | 'desc'

export function LessonsPage() {
  const { householdProfile, studentProfiles: children, allSubjects: subjects } = useHousehold()
  const searchParams = useSearchParams()
  const [lessons, setLessons] = useState<LessonTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filterChildId, setFilterChildId] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<LessonTaskStatus | ''>('')
  const [dateSort, setDateSort] = useState<DateSort>('desc')
  const [showForm, setShowForm] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Sync URL childId → filterChildId after children load and on URL changes
  useEffect(() => {
    if (children.length === 0) return
    const urlChildId = searchParams.get('childId')
    const matched = urlChildId ? children.find((c: StudentProfile) => c.id === urlChildId) : null
    setFilterChildId(matched ? matched.id : '')
  }, [searchParams, children])

  async function fetchLessons() {
    try {
      setIsLoading(true)
      setError(null)
      const all = await plannerApi.getLessons()
      setLessons(all)
    } catch {
      setError('Failed to load lessons')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLessons()
  }, [])

  const filteredLessons = useMemo(() => {
    let list = lessons
    if (filterChildId) list = list.filter(l => l.childId === filterChildId)
    if (filterStatus)  list = list.filter(l => l.status === filterStatus)
    list = [...list].sort((a, b) => {
      const cmp = a.dueDate.localeCompare(b.dueDate)
      return dateSort === 'asc' ? cmp : -cmp
    })
    return list
  }, [lessons, filterChildId, filterStatus, dateSort])

  async function handleSubmit(data: LessonFormData) {
    const householdId = householdProfile?.id ?? ''
    await plannerApi.createLesson({ ...data, householdId })
    await fetchLessons()
    setShowForm(false)
    setSuccessMsg('Lesson added!')
  }

  async function handleUpdate(id: string, patch: Partial<LessonTask>) {
    await plannerApi.updateLesson(id, patch)
    await fetchLessons()
  }

  async function handleDelete(id: string) {
    await plannerApi.deleteLesson(id)
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
            {/* Child filter */}
            <select
              value={filterChildId}
              onChange={e => setFilterChildId(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              <option value="">All children</option>
              {children.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as LessonTaskStatus | '')}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              <option value="">All statuses</option>
              <option value="not_started">Not started</option>
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

        {isLoading ? (
          <p className="text-sm text-slate-400 py-4">Loading…</p>
        ) : (
          <LessonTaskList
            lessons={filteredLessons}
            children={children}
            subjects={subjects}
            error={error}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  )
}
