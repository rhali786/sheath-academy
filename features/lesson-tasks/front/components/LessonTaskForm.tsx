'use client'

import { useState, useEffect } from 'react'
import type { LessonTask, LessonTaskStatus, CreateLessonTaskInput, UpdateLessonTaskInput } from '@/features/lesson-tasks/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

interface Props {
  children: StudentProfile[]
  subjects: SubjectCourse[]
  initialValues?: LessonTask
  onSubmit: (input: CreateLessonTaskInput | (UpdateLessonTaskInput & { id: string })) => Promise<void>
  onCancel?: () => void
}

const STATUS_OPTIONS: { value: LessonTaskStatus; label: string }[] = [
  { value: 'not_started', label: 'Not started' },
  { value: 'completed', label: 'Completed' },
  { value: 'skipped', label: 'Skipped' },
]

function isValidResourceLink(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

export function LessonTaskForm({ children, subjects, initialValues, onSubmit, onCancel }: Props) {
  const isEdit = Boolean(initialValues)
  const today = new Date().toISOString().split('T')[0]

  const defaultChildId = initialValues?.childId ?? children[0]?.id ?? ''

  const [childId, setChildId] = useState(defaultChildId)
  const [subjectId, setSubjectId] = useState(initialValues?.subjectId ?? '')
  const [date, setDate] = useState(initialValues?.date ?? today)
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [status, setStatus] = useState<LessonTaskStatus>(initialValues?.status ?? 'not_started')
  const [notes, setNotes] = useState(initialValues?.notes ?? '')
  const [resourceLink, setResourceLink] = useState(initialValues?.resourceLink ?? '')
  const [titleError, setTitleError] = useState('')
  const [resourceLinkError, setResourceLinkError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredSubjects = subjects.filter(s => s.childId === childId)

  useEffect(() => {
    // When child changes, reset subject to first available or empty
    const first = filteredSubjects[0]?.id ?? ''
    setSubjectId(first)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId])

  // On initial render with edit values, set subject correctly
  useEffect(() => {
    if (initialValues?.subjectId) {
      setSubjectId(initialValues.subjectId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function validate(): boolean {
    let valid = true

    if (!title.trim()) {
      setTitleError('Title is required.')
      valid = false
    } else {
      setTitleError('')
    }

    if (resourceLink && !isValidResourceLink(resourceLink)) {
      setResourceLinkError('Must start with http:// or https://')
      valid = false
    } else {
      setResourceLinkError('')
    }

    return valid
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      if (isEdit && initialValues) {
        await onSubmit({
          id: initialValues.id,
          childId,
          subjectId,
          title: title.trim(),
          date,
          status,
          notes: notes || undefined,
          resourceLink: resourceLink || undefined,
        })
      } else {
        await onSubmit({
          childId,
          subjectId,
          title: title.trim(),
          date,
          status,
          notes: notes || undefined,
          resourceLink: resourceLink || undefined,
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-base font-semibold text-slate-900">
        {isEdit ? 'Edit lesson' : 'Add a lesson'}
      </h2>

      {/* Child */}
      <div>
        <label htmlFor="lt-child" className="block text-xs font-medium text-slate-700 mb-1">
          Child
        </label>
        <select
          id="lt-child"
          value={childId}
          onChange={e => setChildId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-500"
        >
          {children.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="lt-subject" className="block text-xs font-medium text-slate-700 mb-1">
          Subject
        </label>
        <select
          id="lt-subject"
          value={subjectId}
          onChange={e => setSubjectId(e.target.value)}
          disabled={filteredSubjects.length === 0}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-500 disabled:opacity-50"
        >
          {filteredSubjects.length === 0 ? (
            <option value="" disabled>No subjects for this child</option>
          ) : (
            filteredSubjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))
          )}
        </select>
      </div>

      {/* Date */}
      <div>
        <label htmlFor="lt-date" className="block text-xs font-medium text-slate-700 mb-1">
          Date
        </label>
        <input
          id="lt-date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
      </div>

      {/* Title */}
      <div>
        <label htmlFor="lt-title" className="block text-xs font-medium text-slate-700 mb-1">
          Title
        </label>
        <input
          id="lt-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Chapter 4 reading, math worksheet"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
        {titleError && (
          <p className="mt-1 text-xs text-red-600" role="alert">{titleError}</p>
        )}
      </div>

      {/* Status */}
      <div>
        <label htmlFor="lt-status" className="block text-xs font-medium text-slate-700 mb-1">
          Status
        </label>
        <select
          id="lt-status"
          value={status}
          onChange={e => setStatus(e.target.value as LessonTaskStatus)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-500"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="lt-notes" className="block text-xs font-medium text-slate-700 mb-1">
          Notes <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          id="lt-notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Page numbers, instructions, reminders"
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
      </div>

      {/* Resource link */}
      <div>
        <label htmlFor="lt-resource-link" className="block text-xs font-medium text-slate-700 mb-1">
          Resource link <span className="text-slate-400">(optional)</span>
        </label>
        <input
          id="lt-resource-link"
          type="text"
          value={resourceLink}
          onChange={e => setResourceLink(e.target.value)}
          placeholder="https://"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
        {resourceLinkError && (
          <p className="mt-1 text-xs text-red-600" role="alert">{resourceLinkError}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-forest-900 text-white hover:bg-forest-800 disabled:opacity-50 transition-colors"
        >
          {isEdit ? 'Save changes' : 'Add lesson'}
        </button>
        {onCancel && (
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
