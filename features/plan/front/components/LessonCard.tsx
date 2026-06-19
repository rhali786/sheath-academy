'use client'

import { useEffect, useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { InlineConfirm } from '@/features/lib/front/components/InlineConfirm'
import type { LessonTask, LessonTaskStatus } from '@/features/plan/types'
import { formatCompletionWindow } from '@/features/plan/utils/lessonCompletionWindow'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'
import { filterSubjectsForLearner } from '@/features/subjects/lib/enrollment'

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
  onUpdate?: (id: string, patch: Partial<LessonTask> & { applyToGroup?: boolean }) => Promise<void>
  /** Legacy: called when Edit button is clicked (top-form pattern) — kept for backward compatibility */
  onEdit?: (lesson: LessonTask) => void
  onDelete?: (id: string) => void
  /** Open inline edit on mount (e.g. deep-linked from /plan). */
  defaultEditing?: boolean
}

export function LessonCard({ lesson, childName, subjectName, children, subjects, onUpdate, onEdit, onDelete, defaultEditing = false }: LessonCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [editTitle, setEditTitle] = useState(lesson.title)
  const [editChildId, setEditChildId] = useState(lesson.childId)
  const [editSubjectId, setEditSubjectId] = useState(lesson.subjectId)
  const [editPlannedStartDate, setEditPlannedStartDate] = useState(lesson.plannedStartDate ?? '')
  const [editDueDate, setEditDueDate] = useState(lesson.dueDate)
  const [editStatus, setEditStatus] = useState<LessonTaskStatus>(lesson.status)
  const [editDescription, setEditDescription] = useState(lesson.description ?? '')
  const [editResourceLink, setEditResourceLink] = useState(lesson.resourceLink ?? '')
  const [applyToGroup, setApplyToGroup] = useState(false)
  const [titleError, setTitleError] = useState('')

  const dateFormatted = new Date(`${lesson.dueDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const windowLabel = formatCompletionWindow(lesson)

  const today = todayLocal()
  const isOverdue = lesson.status === 'not_started' && lesson.dueDate < today

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
    setEditPlannedStartDate(lesson.plannedStartDate ?? '')
    setEditDueDate(lesson.dueDate)
    setEditStatus(lesson.status)
    setEditDescription(lesson.description ?? '')
    setEditResourceLink(lesson.resourceLink ?? '')
    setApplyToGroup(false)
    setTitleError('')
    // If inline edit is available (onUpdate provided), use it; otherwise fall back to legacy onEdit
    if (onUpdate) {
      setIsEditing(true)
    } else if (onEdit) {
      onEdit(lesson)
    }
  }

  useEffect(() => {
    if (defaultEditing && onUpdate) {
      startEdit()
    }
    // Only run when deep-linked to this card
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultEditing, lesson.id])

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
        plannedStartDate: editPlannedStartDate || undefined,
        dueDate: editDueDate,
        status: editStatus,
        description: editDescription.trim() || undefined,
        resourceLink: editResourceLink.trim() || undefined,
        ...(lesson.groupId && applyToGroup ? { applyToGroup: true } : {}),
      })
      setIsEditing(false)
      setTitleError('')
    } catch {
      // keep form open on error
    } finally {
      setSaving(false)
    }
  }

  const filteredSubjects = subjects && editChildId
    ? filterSubjectsForLearner(subjects, editChildId)
    : []

  if (isEditing) {
    return (
      <div data-lesson-id={lesson.id} className="bg-white rounded-lg border border-forest-200 shadow-sm overflow-hidden">
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
              <label htmlFor={`edit-planned-start-${lesson.id}`} className="block text-xs font-medium text-slate-500 mb-1">Available from <span className="font-normal text-slate-400">(optional)</span></label>
              <input
                id={`edit-planned-start-${lesson.id}`}
                type="date"
                value={editPlannedStartDate}
                onChange={e => setEditPlannedStartDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label htmlFor={`edit-due-date-${lesson.id}`} className="block text-xs font-medium text-slate-500 mb-1">Due date</label>
              <input
                id={`edit-due-date-${lesson.id}`}
                type="date"
                value={editDueDate}
                onChange={e => setEditDueDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          {lesson.groupId && (
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={applyToGroup}
                onChange={e => setApplyToGroup(e.target.checked)}
                aria-label="Apply to all learners in group"
                className="rounded border-slate-300 text-forest-900 focus:ring-forest-500"
              />
              Apply changes to all learners in this group
            </label>
          )}
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
      <InlineConfirm
        message="Delete this lesson?"
        detail={lesson.title}
        onConfirm={() => { if (onDelete) onDelete(lesson.id) }}
        onCancel={() => setConfirmDelete(false)}
      />
    )
  }

  return (
    <div data-lesson-id={lesson.id} className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900">{lesson.title}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {childName} · {subjectName} · {windowLabel ?? dateFormatted}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {lesson.groupId && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-forest-100 text-forest-700">
              Group lesson
            </span>
          )}
          {isOverdue && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
              Overdue
            </span>
          )}
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
