'use client'

import { useState } from 'react'
import type { LessonTask, LessonTaskStatus } from '@/features/lesson-tasks/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

interface Props {
  lessonTasks: LessonTask[]
  children: StudentProfile[]
  subjects: SubjectCourse[]
  onEdit: (task: LessonTask) => void
  onDelete: (id: string) => void
}

const STATUS_LABELS: Record<LessonTaskStatus, string> = {
  not_started: 'Not started',
  completed: 'Completed',
  skipped: 'Skipped',
}

const STATUS_CLASSES: Record<LessonTaskStatus, string> = {
  not_started: 'bg-slate-100 text-slate-600',
  completed: 'bg-green-100 text-green-700',
  skipped: 'bg-amber-100 text-amber-700',
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function excerptNotes(notes: string): string {
  if (notes.length <= 80) return notes
  return notes.slice(0, 80) + '…'
}

export function LessonTaskList({ lessonTasks, children, subjects, onEdit, onDelete }: Props) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const childMap = new Map(children.map(c => [c.id, c.name]))
  const subjectMap = new Map(subjects.map(s => [s.id, s.name]))

  if (lessonTasks.length === 0) {
    return (
      <p className="text-slate-500 text-sm py-4">
        No lessons yet. Add your first one above.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {lessonTasks.map((task) => (
        <li key={task.id} className="py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 text-sm">{task.title}</p>

              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                <span>{childMap.get(task.childId) ?? task.childId}</span>
                <span>{subjectMap.get(task.subjectId) ?? task.subjectId}</span>
                <span>{formatDate(task.date)}</span>
              </div>

              <span
                className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[task.status]}`}
              >
                {STATUS_LABELS[task.status]}
              </span>

              {task.notes && (
                <p className="mt-1.5 text-xs text-slate-500">{excerptNotes(task.notes)}</p>
              )}

              {task.resourceLink && (
                <a
                  href={task.resourceLink}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="mt-1 inline-block text-xs text-forest-700 hover:underline truncate max-w-[260px]"
                >
                  {task.resourceLink.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>

            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                onClick={() => onEdit(task)}
                className="px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                aria-label={`Edit ${task.title}`}
              >
                Edit
              </button>

              {confirmingId === task.id ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      onDelete(task.id)
                      setConfirmingId(null)
                    }}
                    className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    aria-label="Yes, delete"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    className="px-2 py-1 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    aria-label="Cancel delete"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingId(task.id)}
                  className="px-3 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  aria-label={`Delete ${task.title}`}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
