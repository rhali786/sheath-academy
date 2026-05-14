'use client'

import { useEffect, useState } from 'react'
import { lessonTasksApi } from '@/features/lesson-tasks/front/services/api'
import { LessonTaskForm } from '@/features/lesson-tasks/front/components/LessonTaskForm'
import { LessonTaskList } from '@/features/lesson-tasks/front/components/LessonTaskList'
import type { LessonTask, CreateLessonTaskInput, UpdateLessonTaskInput } from '@/features/lesson-tasks/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'
import { childrenApi } from '@/features/children/front/services/api'
import { subjectsApi } from '@/features/subjects/front/services/api'

export function LessonTasksPage() {
  const [children, setChildren] = useState<StudentProfile[]>([])
  const [subjects, setSubjects] = useState<SubjectCourse[]>([])
  const [lessonTasks, setLessonTasks] = useState<LessonTask[]>([])
  const [editingTask, setEditingTask] = useState<LessonTask | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [childrenRes, subjectsRes, tasksRes] = await Promise.all([
        childrenApi.getAllChildren(),
        subjectsApi.getSubjects(),
        lessonTasksApi.getLessonTasks(),
      ])
      setChildren(childrenRes.data ?? [])
      setSubjects(subjectsRes.data ?? [])
      setLessonTasks(tasksRes.data ?? [])
    } catch {
      setError('Something went wrong loading your lessons. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleCreate(input: CreateLessonTaskInput | (UpdateLessonTaskInput & { id: string })) {
    await lessonTasksApi.createLessonTask(input as CreateLessonTaskInput)
    await loadData()
  }

  async function handleUpdate(input: CreateLessonTaskInput | (UpdateLessonTaskInput & { id: string })) {
    const { id, ...patch } = input as UpdateLessonTaskInput & { id: string }
    await lessonTasksApi.updateLessonTask(id, patch)
    setEditingTask(null)
    await loadData()
  }

  async function handleDelete(id: string) {
    await lessonTasksApi.deleteLessonTask(id)
    await loadData()
  }

  function handleEdit(task: LessonTask) {
    setEditingTask(task)
  }

  function handleCancelEdit() {
    setEditingTask(null)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-slate-500 text-sm">Loading lessons…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Lessons</h1>
        <p className="text-sm text-slate-500 mt-1">
          Plan your week — add a lesson or task for any child and subject.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <LessonTaskForm
          key={editingTask?.id ?? 'new'}
          children={children}
          subjects={subjects}
          initialValues={editingTask ?? undefined}
          onSubmit={editingTask ? handleUpdate : handleCreate}
          onCancel={editingTask ? handleCancelEdit : undefined}
        />
      </div>

      <div>
        <LessonTaskList
          lessonTasks={lessonTasks}
          children={children}
          subjects={subjects}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}
