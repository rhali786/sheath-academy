'use client'

import { useEffect, useState } from 'react'
import { plannerApi } from '@/features/planner/front/services/api'
import { LessonTaskForm, type LessonFormData } from '@/features/planner/front/components/LessonTaskForm'
import { LessonTaskList } from '@/features/planner/front/components/LessonTaskList'
import type { LessonTask } from '@/features/planner/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'
import { childrenApi } from '@/features/children/front/services/api'
import { subjectsApi } from '@/features/subjects/front/services/api'
import { useHousehold } from '@/features/household/front/context'

export function LessonsPage() {
  const { householdProfile } = useHousehold()
  const [children, setChildren] = useState<StudentProfile[]>([])
  const [subjects, setSubjects] = useState<SubjectCourse[]>([])
  const [lessons, setLessons] = useState<LessonTask[]>([])
  const [editingLesson, setEditingLesson] = useState<LessonTask | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const [kidsRes, subsRes] = await Promise.all([
          childrenApi.getAllChildren(),
          subjectsApi.getSubjects(),
        ])
        setChildren(kidsRes.data)
        setSubjects(subsRes.data)
      } catch {
        setError('Failed to load setup data')
      }
    }
    init()
  }, [])

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

  async function handleSubmit(data: LessonFormData) {
    const householdId = householdProfile?.id ?? ''
    if (editingLesson) {
      await plannerApi.updateLesson(editingLesson.id, { ...data, householdId })
      setEditingLesson(undefined)
    } else {
      await plannerApi.createLesson({ ...data, householdId })
    }
    await fetchLessons()
  }

  async function handleDelete(id: string) {
    await plannerApi.deleteLesson(id)
    await fetchLessons()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          {editingLesson ? 'Edit lesson' : 'Add lesson'}
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <LessonTaskForm
            key={editingLesson?.id ?? 'new'}
            children={children}
            subjects={subjects}
            editingLesson={editingLesson}
            onSubmit={handleSubmit}
            onCancel={() => setEditingLesson(undefined)}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">All lessons</h2>
        {isLoading ? (
          <p className="text-sm text-slate-400 py-4">Loading…</p>
        ) : (
          <LessonTaskList
            lessons={lessons}
            children={children}
            subjects={subjects}
            error={error}
            onEdit={setEditingLesson}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  )
}
