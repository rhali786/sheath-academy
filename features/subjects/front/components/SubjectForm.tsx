'use client'

import { useEffect, useState, FormEvent } from 'react'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourseCategory } from '@/features/subjects/types'
import { childrenApi } from '@/features/children/front/services/api'
import { subjectsApi } from '@/features/subjects/front/services/api'

const CATEGORIES: SubjectCourseCategory[] = [
  'Quran',
  'Arabic',
  'IslamicStudies',
  'Math',
  'Reading',
  'Science',
  'History',
  'English',
  'Other',
]

export interface SubjectFormProps {
  /** Called after a subject is created successfully */
  onSuccess?: () => void
  /** When only one child exists, pre-select and hide picker */
  defaultChildId?: string
}

export function SubjectForm({ onSuccess, defaultChildId }: SubjectFormProps) {
  const [children, setChildren] = useState<StudentProfile[]>([])
  const [loadingChildren, setLoadingChildren] = useState(true)
  const [childId, setChildId] = useState(defaultChildId ?? '')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<SubjectCourseCategory>('Math')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingChildren(true)
    childrenApi
      .getAllChildren(false)
      .then((res) => {
        if (cancelled) return
        const list = (res.data ?? []).filter((c) => c.isActive !== false)
        setChildren(list)
        if (defaultChildId) {
          setChildId(defaultChildId)
        } else if (list.length === 1) {
          setChildId(list[0].id)
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
  }, [defaultChildId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!childId || !name.trim()) {
      setError('Choose a child and enter a subject name.')
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

  if (children.length === 0) {
    return (
      <p className="text-sm text-amber-700" data-testid="subject-form-no-children">
        Add a child first, then you can add subjects here.
      </p>
    )
  }

  const showPicker = children.length > 1 && !defaultChildId

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-testid="subject-form">
      {showPicker && (
        <div>
          <label htmlFor="subject-child" className="block text-xs font-medium text-slate-600 mb-1">
            Child
          </label>
          <select
            id="subject-child"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
          >
            <option value="">Select child</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
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
          {CATEGORIES.map((c) => (
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
