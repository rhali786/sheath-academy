'use client'

import { useEffect, useState } from 'react'
import { Pencil, Trash2, Check, X, ListChecks } from 'lucide-react'
import { InlineConfirm } from '@/features/lib/front/components/InlineConfirm'
import { LessonSteps } from '@/features/plan/front/components/LessonSteps'
import type { LessonTask, LessonTaskPatch, LessonTaskStatus } from '@/features/plan/types'
import { formatCompletionWindow } from '@/features/plan/utils/lessonCompletionWindow'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'
import { filterSubjectsForLearner } from '@/features/subjects/lib/enrollment'
import { LessonTimeFields, validateLessonTimes } from '@/features/plan/front/components/LessonTimeFields'
import { GroupEditOptions } from '@/features/plan/front/components/GroupEditOptions'
import { describeLessonTime } from '@/features/schedule/lib/courseTimes'

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
  onUpdate?: (id: string, patch: LessonTaskPatch) => Promise<void>
  /** Legacy: called when Edit button is clicked (top-form pattern) — kept for backward compatibility */
  onEdit?: (lesson: LessonTask) => void
  /** deleteGroup: remove every learner's copy of a shared lesson, not just this one. */
  onDelete?: (id: string, options: { deleteGroup: boolean }) => void | Promise<void>
  /** When provided and lesson is not_started, shows a Check icon button to mark the lesson done. */
  onComplete?: (id: string, status: 'completed') => Promise<void>
  /** Open inline edit on mount (e.g. deep-linked from /plan). */
  defaultEditing?: boolean
  /** Called when the inline editor closes (saved or cancelled), e.g. to clear a deep link. */
  onEditEnd?: () => void
}

export function LessonCard({ lesson, childName, subjectName, children, subjects, onUpdate, onEdit, onDelete, onComplete, defaultEditing = false, onEditEnd }: LessonCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSteps, setShowSteps] = useState(false)
  const [localStatus, setLocalStatus] = useState<LessonTaskStatus>(lesson.status)

  // Edit form state
  const [editTitle, setEditTitle] = useState(lesson.title)
  const [editChildId, setEditChildId] = useState(lesson.childId)
  const [editSubjectId, setEditSubjectId] = useState(lesson.subjectId)
  const [editPlannedStartDate, setEditPlannedStartDate] = useState(lesson.plannedStartDate ?? '')
  const [editDueDate, setEditDueDate] = useState(lesson.dueDate)
  const [editStatus, setEditStatus] = useState<LessonTaskStatus>(lesson.status)
  const [editDescription, setEditDescription] = useState(lesson.description ?? '')
  const [editResourceLink, setEditResourceLink] = useState(lesson.resourceLink ?? '')
  const [editStartTime, setEditStartTime] = useState(lesson.scheduledStartTime ?? '')
  const [editEndTime, setEditEndTime] = useState(lesson.scheduledEndTime ?? '')
  const [timeError, setTimeError] = useState('')
  // Ticked by default: editing a shared lesson edits every learner's copy unless unticked.
  const [applyToGroup, setApplyToGroup] = useState(true)
  // Date/time stay with this learner unless the parent asks to move everyone.
  const [applyScheduleToGroup, setApplyScheduleToGroup] = useState(false)
  const [titleError, setTitleError] = useState('')
  const [courseError, setCourseError] = useState('')
  const [saveError, setSaveError] = useState('')

  // Sync local status when lesson.status updates from parent (e.g., after refetch)
  useEffect(() => {
    setLocalStatus(lesson.status)
  }, [lesson.status])

  const dateFormatted = new Date(`${lesson.dueDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const windowLabel = formatCompletionWindow(lesson)

  const today = todayLocal()
  const isOverdue = localStatus === 'not_started' && lesson.dueDate < today

  const descriptionExcerpt = lesson.description
    ? lesson.description.length > 80
      ? lesson.description.slice(0, 80) + '…'
      : lesson.description
    : undefined

  async function handleMarkDone() {
    if (!onComplete) return
    const prev = localStatus
    setLocalStatus('completed')
    try {
      await onComplete(lesson.id, 'completed')
    } catch {
      setLocalStatus(prev)
    }
  }

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
    setEditStartTime(lesson.scheduledStartTime ?? '')
    setEditEndTime(lesson.scheduledEndTime ?? '')
    setApplyToGroup(true)
    setApplyScheduleToGroup(false)
    setTitleError('')
    setTimeError('')
    setCourseError('')
    setSaveError('')
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
    onEditEnd?.()
    setTitleError('')
    setTimeError('')
    setCourseError('')
    setSaveError('')
  }

  async function saveEdit() {
    const trimmed = editTitle.trim()
    if (!trimmed) {
      setTitleError('Title is required')
      return
    }
    const timeProblem = validateLessonTimes(editStartTime, editEndTime)
    if (timeProblem) {
      setTimeError(timeProblem)
      return
    }
    setTimeError('')
    // Switching learner clears the course; the new learner needs one of their own.
    if (subjects && subjects.length > 0 && !editSubjectId) {
      const name = children?.find(c => c.id === editChildId)?.name ?? childName
      setCourseError(`Choose a course for ${name}`)
      return
    }
    setCourseError('')
    if (!onUpdate) return
    setSaving(true)
    setSaveError('')
    try {
      await onUpdate(lesson.id, {
        title: trimmed,
        childId: editChildId,
        subjectId: editSubjectId,
        // null, not undefined: the route only touches plannedStartDate when it is sent.
        plannedStartDate: editPlannedStartDate || null,
        dueDate: editDueDate,
        status: editStatus,
        // '' not undefined: undefined is dropped from the body, so a cleared field was kept.
        description: editDescription.trim(),
        resourceLink: editResourceLink.trim(),
        // null, not undefined: blank must clear the lesson's own time on the server.
        scheduledStartTime: editStartTime.trim() || null,
        scheduledEndTime: editEndTime.trim() || null,
        ...(lesson.groupId && applyToGroup ? { applyToGroup: true } : {}),
        ...(lesson.groupId && applyToGroup && applyScheduleToGroup ? { applyScheduleToGroup: true } : {}),
      })
      setIsEditing(false)
      setTitleError('')
      onEditEnd?.()
    } catch (err) {
      // Keep the form open and say why, e.g. the course is not one of this learner's.
      setSaveError(err instanceof Error && err.message ? err.message : 'Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  const editCourse = subjects?.find(s => s.id === editSubjectId)
  const timeHint = editCourse
    ? describeLessonTime({ courseName: editCourse.name, blocks: editCourse.recurringSchedule, date: editDueDate, ownStart: editStartTime, ownEnd: editEndTime })
    : null

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
                <label htmlFor={`edit-child-${lesson.id}`} className="block text-xs font-medium text-slate-500 mb-1">Child</label>
                <select
                  id={`edit-child-${lesson.id}`}
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
                <label htmlFor={`edit-course-${lesson.id}`} className="block text-xs font-medium text-slate-500 mb-1">Course</label>
                <select
                  id={`edit-course-${lesson.id}`}
                  value={editSubjectId}
                  onChange={e => { setEditSubjectId(e.target.value); setCourseError('') }}
                  disabled={!editChildId}
                  className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500 disabled:opacity-50"
                >
                  <option value="">Select course</option>
                  {filteredSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {courseError && <p className="text-xs text-red-600 mt-1">{courseError}</p>}
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
          <LessonTimeFields
            idPrefix={`lesson-card-${lesson.id}`}
            start={editStartTime}
            end={editEndTime}
            onStartChange={setEditStartTime}
            onEndChange={setEditEndTime}
            error={timeError}
            hint={timeHint}
          />
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
            <GroupEditOptions
              childName={childName}
              applyToGroup={applyToGroup}
              applyScheduleToGroup={applyScheduleToGroup}
              onApplyToGroupChange={setApplyToGroup}
              onApplyScheduleToGroupChange={setApplyScheduleToGroup}
            />
          )}
          {saveError && <p role="alert" className="text-xs text-red-600">{saveError}</p>}
          <div className="flex gap-2 justify-end">
            {onDelete && (
              <button
                type="button"
                onClick={() => { setIsEditing(false); setConfirmDelete(true); onEditEnd?.() }}
                aria-label="Delete this lesson"
                className="mr-auto flex items-center gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            )}
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
        detail={lesson.groupId ? `“${lesson.title}” is shared with other learners.` : lesson.title}
        {...(lesson.groupId
          ? {
              confirmLabel: 'All learners in this group',
              secondaryAction: { label: `Just ${childName}`, onConfirm: () => onDelete?.(lesson.id, { deleteGroup: false }) },
            }
          : {})}
        onConfirm={() => onDelete?.(lesson.id, { deleteGroup: Boolean(lesson.groupId) })}
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
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE_CLASS[localStatus]}`}>
            {STATUS_LABELS[localStatus]}
          </span>
          {onComplete && localStatus === 'not_started' && (
            <button
              onClick={handleMarkDone}
              aria-label="Mark lesson done"
              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
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
          <button
            onClick={() => setShowSteps(v => !v)}
            aria-label="Toggle lesson steps"
            aria-expanded={showSteps}
            className="p-1.5 text-slate-400 hover:text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
          >
            <ListChecks className="w-3.5 h-3.5" />
          </button>
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

      {showSteps && (
        <div className="border-t border-slate-100 pt-2">
          <LessonSteps lessonTaskId={lesson.id} />
        </div>
      )}
    </div>
  )
}
