'use client'

import { useEffect, useState, FormEvent } from 'react'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourseCategory } from '@/features/subjects/types'
import { SUBJECT_COURSE_CATEGORIES } from '@/features/subjects/front/lib/categories'
import { childrenApi } from '@/features/children/front/services/api'
import { subjectsApi } from '@/features/subjects/front/services/api'

export interface SubjectFormProps {
  /** Matches `StudentProfile.householdId` (household profile id, not workspace id). */
  householdId: string
  /** Called after a subject is created successfully */
  onSuccess?: () => void
  /** When set, keeps `childId` in sync (e.g. Settings child tabs). */
  defaultChildId?: string
  /** Hide the child dropdown — parent UI owns child selection (tabs only). */
  hideChildSelect?: boolean
}

export function SubjectForm({ householdId, onSuccess, defaultChildId, hideChildSelect }: SubjectFormProps) {
  const [children, setChildren] = useState<StudentProfile[]>([])
  const [loadingChildren, setLoadingChildren] = useState(true)
  const [childId, setChildId] = useState(defaultChildId ?? '')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<SubjectCourseCategory>('Math')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!householdId.trim()) {
      setChildren([])
      setChildId('')
      setLoadingChildren(false)
      return
    }
    setLoadingChildren(true)
    childrenApi
      .getChildren(householdId, false)
      .then((res) => {
        if (cancelled) return
        const list = (res.data ?? []).filter((c) => c.isActive !== false)
        setChildren(list)
        if (defaultChildId) {
          setChildId(defaultChildId)
        } else if (list.length === 1) {
          setChildId(list[0].id)
        } else {
          setChildId('')
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load children')
      })
      .finally(() => {
        if (!cancelled) setLoadingChildren(false)
      })
    return () => {
      cancelled = true
    }
  }, [defaultChildId, householdId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!childId || !name.trim()) {
      setError(
        hideChildSelect && children.length > 1
          ? 'Pick a child using the tabs above, then enter a subject name.'
          : 'Choose a child and enter a subject name.'
      )
      return
    }
    setSubmitting(true)
    try {
      await subjectsApi.createSubject({
        childId,
        name: name.trim(),
        category,
      })
      setName('')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create subject')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingChildren) {
    return (
      <p className="text-sm text-slate-500" data-testid="subject-form-loading">
        Loading children…
      </p>
    )
  }

  if (!householdId.trim()) {
    return (
      <p className="text-sm text-amber-700" data-testid="subject-form-no-household">
        Household is not ready yet. Finish setup, then add subjects here.
      </p>
    )
  }

  if (children.length === 0) {
    return (
      <p className="text-sm text-amber-700" data-testid="subject-form-no-children">
        No children in this household yet. Add a child in the Children tab first.
      </p>
    )
  }

  const needsChildPlaceholder = !hideChildSelect && children.length > 1

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-testid="subject-form">
      {!hideChildSelect && (
        <div>
          <label htmlFor="subject-child" className="block text-xs font-medium text-slate-600 mb-1">
            Subject for (child)
          </label>
          <select
            id="subject-child"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
          >
            {needsChildPlaceholder && <option value="">Select child</option>}
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1">Each subject is stored for one child.</p>
        </div>
      )}

      {hideChildSelect && children.length > 1 && (
        <p className="text-xs text-slate-500" data-testid="subject-form-tabs-hint">
          New subjects are added for the child selected in the tabs above.
        </p>
      )}

      <div>
        <label htmlFor="subject-name" className="block text-xs font-medium text-slate-600 mb-1">
          Subject name
        </label>
        <input
          id="subject-name"
          type="text"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Algebra"
          maxLength={120}
        />
      </div>

      <div>
        <label htmlFor="subject-category" className="block text-xs font-medium text-slate-600 mb-1">
          Category
        </label>
        <select
          id="subject-category"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value as SubjectCourseCategory)}
        >
          {SUBJECT_COURSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !name.trim() || !childId}
        className="w-full py-2.5 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800 disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Add subject'}
      </button>
    </form>
  )
}
