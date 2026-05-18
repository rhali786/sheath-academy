'use client'

import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import type { LessonTask, LessonTaskStatus } from '@/features/plan/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

const STATUS_LABELS: Record<LessonTaskStatus, string> = {
  not_started: 'Not started',
  completed: 'Completed',
  skipped: 'Skipped',
}

const STATUS_BADGE_CLASS: Record<LessonTaskStatus, string> = {
  not_started: 'bg-slate-100 text-slate-600',
  completed: 'bg-green-100 text-green-700',
  skipped: 'bg-amber-100 text-amber-700',
}

function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

interface LessonCardProps {
  lesson: LessonTask
  childName: string
  subjectName: string
  /** If provided, list of all children (for edit form selects) */
  children?: StudentProfile[]
  /** If provided, list of all subjects (for edit form selects) */
  subjects?: SubjectCourse[]
  /** Called with the updated patch when save is pressed */
  onUpdate?: (id: string, patch: Partial<LessonTask>) => Promise<void>
  /** Legacy: called when Edit button is clicked (top-form pattern) — kept for backward compatibility */
  onEdit?: (lesson: LessonTask) => void
  onDelete?: (id: string) => void
}

export function LessonCard({ lesson, childName, subjectName, children, subjects, onUpdate, onEdit, onDelete }: LessonCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [editTitle, setEditTitle] = useState(lesson.title)
  const [editChildId, setEditChildId] = useState(lesson.childId)
  const [editSubjectId, setEditSubjectId] = useState(lesson.subjectId)
  const [editDueDate, setEditDueDate] = useState(lesson.dueDate)
  const [editStatus, setEditStatus] = useState<LessonTaskStatus>(lesson.status)
  const [editDescription, setEditDescription] = useState(lesson.description ?? '')
  const [editResourceLink, setEditResourceLink] = useState(lesson.resourceLink ?? '')
  const [titleError, setTitleError] = useState('')

  const dateFormatted = new Date(`${lesson.dueDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const descriptionExcerpt = lesson.description
    ? lesson.description.length > 80
      ? lesson.description.slice(0, 80) + '…'
      : lesson.description
    : undefined

  function startEdit() {
    setConfirmDelete(false)
    setEditTitle(lesson.title)
    setEditChildId(lesson.childId)
    setEditSubjectId(lesson.subjectId)
    setEditDueDate(lesson.dueDate)
    setEditStatus(lesson.status)
    setEditDescription(lesson.description ?? '')
    setEditResourceLink(lesson.resourceLink ?? '')
    setTitleError('')
    // If inline edit is available (onUpdate provided), use it; otherwise fall back to legacy onEdit
    if (onUpdate) {
      setIsEditing(true)
    } else if (onEdit) {
      onEdit(lesson)
    }
  }

  function cancelEdit() {
    setIsEditing(false)
    setTitleError('')
  }

  async function saveEdit() {
    const trimmed = editTitle.trim()
    if (!trimmed) {
      setTitleError('Title is required')
      return
    }
    if (!onUpdate) return
    setSaving(true)
    try {
      await onUpdate(lesson.id, {
        title: trimmed,
        childId: editChildId,
        subjectId: editSubjectId,
        dueDate: editDueDate,
        status: editStatus,
        description: editDescription.trim() || undefined,
        resourceLink: editResourceLink.trim() || undefined,
      })
      setIsEditing(false)
      setTitleError('')
    } catch {
      // keep form open on error
    } finally {
      setSaving(false)
    }
  }

  const filteredSubjects = subjects
    ? subjects.filter(s => s.childId === editChildId)
    : []

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg border border-forest-200 shadow-sm overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {children && children.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Child</label>
                <select
                  value={editChildId}
                  onChange={e => { setEditChildId(e.target.value); setEditSubjectId('') }}
                  className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
                >
                  <option value="">Select child</option>
                  {children.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            {subjects && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Subject</label>
                <select
                  value={editSubjectId}
                  onChange={e => setEditSubjectId(e.target.value)}
                  disabled={!editChildId}
                  className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500 disabled:opacity-50"
                >
                  <option value="">Select subject</option>
                  {filteredSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              maxLength={120}
              className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
            {titleError && <p className="text-xs text-red-600 mt-1">{titleError}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Due date</label>
              <input
                type="date"
                value={editDueDate}
                onChange={e => setEditDueDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value as LessonTaskStatus)}
                className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
              >
                <option value="not_started">Not started</option>
                <option value="completed">Completed</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Description <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              rows={2}
              className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Resource link <span className="font-normal text-slate-400">(optional)</span></label>
            <input
              type="url"
              value={editResourceLink}
              onChange={e => setEditResourceLink(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelEdit}
              aria-label="Cancel edit"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg transition-colors"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={saving}
              aria-label="Save lesson"
              className="flex items-center gap-1 text-xs text-white bg-forest-900 hover:bg-forest-800 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Check className="w-3 h-3" /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (confirmDelete) {
    return (
      <div className="p-4 bg-white rounded-lg border border-red-200 shadow-sm">
        <p className="text-sm font-medium text-red-700 mb-1">Delete this lesson?</p>
        <p className="text-xs text-slate-500 mb-3">{lesson.title}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setConfirmDelete(false)}
            aria-label="Cancel delete"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg transition-colors"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
          <button
            onClick={() => { if (onDelete) onDelete(lesson.id); setConfirmDelete(false) }}
            aria-label="Confirm delete lesson"
            className="flex items-center gap-1 text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900">{lesson.title}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {childName} · {subjectName} · {dateFormatted}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE_CLASS[lesson.status]}`}>
            {STATUS_LABELS[lesson.status]}
          </span>
          {(onUpdate || onEdit) && (
            <button
              onClick={startEdit}
              aria-label="Edit lesson"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete lesson"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {descriptionExcerpt && (
        <p className="text-sm text-slate-600">{descriptionExcerpt}</p>
      )}

      {lesson.resourceLink && (
        <a
          href={lesson.resourceLink}
          rel="noopener noreferrer"
          target="_blank"
          className="text-xs text-forest-700 hover:underline break-all block"
        >
          {lesson.resourceLink}
        </a>
      )}
    </div>
  )
}
