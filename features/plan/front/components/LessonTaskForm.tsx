'use client'

import { useEffect, useState } from 'react'
import type { LessonTask, LessonTaskStatus } from '@/features/plan/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export interface LessonFormData {
  childId: string
  subjectId: string
  title: string
  description?: string
  resourceLink?: string
  dueDate: string
  status: LessonTaskStatus
  order: number
}

interface LessonTaskFormProps {
  children: StudentProfile[]
  subjects: SubjectCourse[]
  editingLesson?: LessonTask
  onSubmit: (data: LessonFormData) => Promise<void>
  onCancel?: () => void
}

export function LessonTaskForm({
  children,
  subjects,
  editingLesson,
  onSubmit,
  onCancel,
}: LessonTaskFormProps) {
  const isEdit = Boolean(editingLesson)

  const [childId, setChildId] = useState(editingLesson?.childId ?? '')
  const [subjectId, setSubjectId] = useState(editingLesson?.subjectId ?? '')
  const [title, setTitle] = useState(editingLesson?.title ?? '')
  const [description, setDescription] = useState(editingLesson?.description ?? '')
  const [resourceLink, setResourceLink] = useState(editingLesson?.resourceLink ?? '')
  const [dueDate, setDueDate] = useState(editingLesson?.dueDate ?? todayLocal())
  const [status, setStatus] = useState<LessonTaskStatus>(editingLesson?.status ?? 'not_started')
  const [titleError, setTitleError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset subject when child changes (except on initial load in edit mode)
  const [prevChildId, setPrevChildId] = useState(editingLesson?.childId ?? '')
  useEffect(() => {
    if (childId !== prevChildId) {
      setSubjectId('')
      setPrevChildId(childId)
    }
  }, [childId, prevChildId])

  const filteredSubjects = subjects.filter(s => s.childId === childId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTitleError('')

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setTitleError('Title is required')
      return
    }
    if (trimmedTitle.length > 120) {
      setTitleError('Title must be 120 characters or fewer')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        childId,
        subjectId,
        title: trimmedTitle,
        description: description.trim() || undefined,
        resourceLink: resourceLink.trim() || undefined,
        dueDate,
        status,
        order: editingLesson?.order ?? 0,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="childId" className="block text-sm font-medium text-slate-700 mb-1">
            Child
          </label>
          <select
            id="childId"
            value={childId}
            onChange={e => setChildId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          >
            <option value="">Select child</option>
            {children.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subjectId" className="block text-sm font-medium text-slate-700 mb-1">
            Subject
          </label>
          <select
            id="subjectId"
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            disabled={!childId}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 disabled:opacity-50"
          >
            <option value="">Select subject</option>
            {filteredSubjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={120}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
        {titleError && <p className="text-xs text-red-600 mt-1">{titleError}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 mb-1">
            Due date
          </label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={e => setStatus(e.target.value as LessonTaskStatus)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          >
            <option value="not_started">Not started</option>
            <option value="completed">Completed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
          Description <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none"
        />
      </div>

      <div>
        <label htmlFor="resourceLink" className="block text-sm font-medium text-slate-700 mb-1">
          Resource link <span className="text-slate-400 font-normal">(optional, https://…)</span>
        </label>
        <input
          id="resourceLink"
          type="url"
          value={resourceLink}
          onChange={e => setResourceLink(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-forest-900 text-white hover:bg-forest-800 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add lesson'}
        </button>
        {isEdit && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
