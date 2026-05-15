'use client'

import { useState } from 'react'
import type { LessonTask, LessonTaskStatus } from '@/features/planner/types'

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

interface LessonCardProps {
  lesson: LessonTask
  childName: string
  subjectName: string
  onEdit?: (lesson: LessonTask) => void
  onDelete?: (id: string) => void
}

export function LessonCard({ lesson, childName, subjectName, onEdit, onDelete }: LessonCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

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

  return (
    <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900">{lesson.title}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {childName} · {subjectName} · {dateFormatted}
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_BADGE_CLASS[lesson.status]}`}>
          {STATUS_LABELS[lesson.status]}
        </span>
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

      <div className="flex items-center gap-2 pt-1">
        {onEdit && (
          <button
            onClick={() => onEdit(lesson)}
            className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Edit
          </button>
        )}
        {onDelete && !confirmDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        )}
        {onDelete && confirmDelete && (
          <>
            <span className="text-xs text-slate-600">Delete this lesson?</span>
            <button
              onClick={() => { onDelete(lesson.id); setConfirmDelete(false) }}
              className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}
