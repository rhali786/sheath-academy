'use client'

import { useEffect, useState } from 'react'
import { plannerApi } from '@/features/plan/front/services/api'
import { LessonTaskForm, type LessonFormData } from '@/features/plan/front/components/LessonTaskForm'
import { useHousehold } from '@/features/household/front/context'
import { InlineConfirm } from '@/features/lib/front/components/InlineConfirm'
import type { LessonTask } from '@/features/plan/types'

export interface EditLessonModalProps {
  lessonId: string
  onClose: () => void
  onSaved: () => void
}

/**
 * The Edit lesson window, opened in place from the Dashboard, Calendar and Planner so
 * the parent never leaves the day they are looking at. Reuses LessonTaskForm (edit
 * mode) inside the app's dialog pattern (see SubjectEditDialog). Owned by Plan; other
 * features compose it. Escape or a click outside closes it without saving.
 */
export function EditLessonModal({ lessonId, onClose, onSaved }: EditLessonModalProps) {
  const { studentProfiles: children, allSubjects: subjects, householdProfile } = useHousehold()
  const [lesson, setLesson] = useState<LessonTask | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    plannerApi
      .getLesson(lessonId)
      .then((result) => {
        if (cancelled) return
        if (!result) {
          setError('Could not find this lesson.')
        } else {
          setLesson(result)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this lesson.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [lessonId])

  // Errors propagate to the confirmation, which shows them and stays open.
  async function handleDelete(deleteGroup: boolean) {
    await plannerApi.deleteLesson(lessonId, { deleteGroup })
    onSaved()
    onClose()
  }

  const childName = children.find(c => c.id === lesson?.childId)?.name ?? 'this learner'

  async function handleSubmit(data: LessonFormData) {
    setSaveError(null)
    try {
      await plannerApi.updateLesson(lessonId, data)
      onSaved()
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save changes')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="presentation"
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-lesson-modal-title"
        data-testid="edit-lesson-modal"
        className="w-full max-w-lg rounded-xl bg-white shadow-lg border border-slate-200 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="edit-lesson-modal-title" className="text-lg font-semibold text-slate-900 mb-4">
          Edit lesson
        </h2>

        {loading && <p className="text-sm text-slate-400">Loading…</p>}
        {!loading && error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && lesson && confirmingDelete && (
          <InlineConfirm
            message="Delete this lesson?"
            detail={lesson.groupId ? `“${lesson.title}” is shared with other learners.` : lesson.title}
            {...(lesson.groupId
              ? {
                  confirmLabel: 'All learners in this group',
                  secondaryAction: { label: `Just ${childName}`, onConfirm: () => handleDelete(false) },
                }
              : {})}
            onConfirm={() => handleDelete(Boolean(lesson.groupId))}
            onCancel={() => setConfirmingDelete(false)}
          />
        )}
        {!loading && !error && lesson && !confirmingDelete && (
          <>
            {saveError && <p role="alert" className="text-xs text-red-600 mb-2">{saveError}</p>}
            <LessonTaskForm
              children={children}
              subjects={subjects}
              editingLesson={lesson}
              schoolDays={householdProfile?.schoolDays}
              onSubmit={handleSubmit}
              onCancel={onClose}
              onDelete={() => setConfirmingDelete(true)}
              autoFocusTitle
            />
          </>
        )}
      </div>
    </div>
  )
}
