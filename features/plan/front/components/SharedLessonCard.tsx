'use client'

import { useState } from 'react'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { InlineConfirm } from '@/features/lib/front/components/InlineConfirm'
import { LessonCard } from '@/features/plan/front/components/LessonCard'
import type { LessonTask, LessonTaskPatch, LessonTaskStatus } from '@/features/plan/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

interface SharedLessonCardProps {
  /** Every copy of one shared lesson that is in view (2+). */
  copies: LessonTask[]
  children: StudentProfile[]
  subjects: SubjectCourse[]
  onUpdate?: (id: string, patch: LessonTaskPatch) => Promise<void>
  onDelete?: (id: string, options: { deleteGroup: boolean }) => void | Promise<void>
  onComplete?: (id: string, status: 'completed') => Promise<void>
  /** Deep link to one copy: open expanded with that copy's editor. */
  editingLessonId?: string | null
  onEditEnd?: () => void
}

const STATUS_LABEL: Record<LessonTaskStatus | 'overdue', string> = {
  not_started: 'Not started',
  completed: 'Completed',
  skipped: 'Skipped',
  overdue: 'Overdue',
}

const STATUS_CHIP: Record<LessonTaskStatus | 'overdue', string> = {
  not_started: 'bg-slate-100 text-slate-600',
  completed: 'bg-green-100 text-green-700',
  skipped: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
}

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/**
 * One card for a lesson shared by several learners: title once, a chip per learner with
 * that learner's status, and the learners' own cards (mark done, edit, delete) on expand.
 * Edit opens the first copy's editor with "apply to all learners" ticked; Delete removes
 * every copy.
 */
export function SharedLessonCard({
  copies,
  children,
  subjects,
  onUpdate,
  onDelete,
  onComplete,
  editingLessonId = null,
  onEditEnd,
}: SharedLessonCardProps) {
  const deepLinked = copies.some(c => c.id === editingLessonId)
  const [expanded, setExpanded] = useState(deepLinked)
  const [editTarget, setEditTarget] = useState<string | null>(deepLinked ? editingLessonId : null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const first = copies[0]
  const today = todayLocal()
  const nameOf = (childId: string) => children.find(c => c.id === childId)?.name ?? childId
  const courseNames = [...new Set(copies.map(c => subjects.find(s => s.id === c.subjectId)?.name).filter(Boolean))]
  const dates = copies.map(c => c.dueDate).sort()
  const dateLabel = dates[0] === dates[dates.length - 1]
    ? formatDay(dates[0])
    : `${formatDay(dates[0])} – ${formatDay(dates[dates.length - 1])}`

  if (confirmDelete) {
    return (
      <InlineConfirm
        message={`Delete “${first.title}” for all ${copies.length} learners?`}
        detail={copies.map(c => nameOf(c.childId)).join(', ')}
        confirmLabel={`Delete for all ${copies.length}`}
        onConfirm={() => onDelete?.(first.id, { deleteGroup: true })}
        onCancel={() => setConfirmDelete(false)}
      />
    )
  }

  return (
    <div data-shared-group={first.groupId} className="p-4 bg-white rounded-lg border border-slate-200 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900">{first.title}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {courseNames.length > 0 && <>{courseNames.join(', ')} · </>}
            <span data-testid="shared-lesson-date">{dateLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-forest-100 text-forest-700">
            Shared · {copies.length} learners
          </span>
          {onUpdate && (
            <button
              type="button"
              onClick={() => { setExpanded(true); setEditTarget(first.id) }}
              aria-label="Edit shared lesson"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete shared lesson"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <ul aria-label="Learners" className="flex flex-wrap gap-1.5">
        {copies.map(c => {
          const status = c.status === 'not_started' && c.dueDate < today ? 'overdue' : c.status
          return (
            <li
              key={c.id}
              aria-label={`${nameOf(c.childId)}: ${STATUS_LABEL[status]}`}
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CHIP[status]}`}
            >
              {nameOf(c.childId)}
              <span aria-hidden="true"> · {STATUS_LABEL[status]}</span>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        className="flex items-center gap-1 text-xs font-medium text-forest-800 hover:underline"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        {expanded ? 'Hide learners' : 'Show learners'}
      </button>

      {expanded && (
        <div className="space-y-2 pl-3 border-l-2 border-forest-100">
          {copies.map(c => (
            <LessonCard
              key={c.id}
              lesson={c}
              childName={nameOf(c.childId)}
              subjectName={subjects.find(s => s.id === c.subjectId)?.name ?? c.subjectId}
              children={children}
              subjects={subjects}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onComplete={onComplete}
              defaultEditing={editTarget === c.id}
              onEditEnd={() => { setEditTarget(null); onEditEnd?.() }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
