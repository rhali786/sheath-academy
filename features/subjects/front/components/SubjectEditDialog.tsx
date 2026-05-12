'use client'

import { useEffect, useState, FormEvent } from 'react'
import type { SubjectCourse, SubjectCourseCategory } from '@/features/subjects/types'
import { SUBJECT_COURSE_CATEGORIES } from '@/features/subjects/front/lib/categories'
import { subjectsApi } from '@/features/subjects/front/services/api'

export interface SubjectChildOption {
  id: string
  name: string
}

export interface SubjectEditDialogProps {
  open: boolean
  subject: SubjectCourse | null
  childrenList: SubjectChildOption[]
  onClose: () => void
  onSaved: () => void
}

export function SubjectEditDialog({
  open,
  subject,
  childrenList,
  onClose,
  onSaved,
}: SubjectEditDialogProps) {
  const [name, setName] = useState('')
  const [childId, setChildId] = useState('')
  const [category, setCategory] = useState<SubjectCourseCategory>('Math')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !subject) return
    setName(subject.name)
    setChildId(subject.childId)
    setCategory(subject.category)
    setError(null)
  }, [open, subject])

  if (!open || !subject) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !childId) {
      setError('Name and child are required.')
      return
    }
    setSaving(true)
    try {
      await subjectsApi.updateSubject(subject.id, {
        name: name.trim(),
        childId,
        category,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes')
    } finally {
      setSaving(false)
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
        aria-labelledby="subject-edit-title"
        className="w-full max-w-md rounded-xl bg-white shadow-lg border border-slate-200 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="subject-edit-title" className="text-lg font-semibold text-slate-900 mb-4">
          Edit subject
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3" data-testid="subject-edit-form">
          <div>
            <label htmlFor="edit-subject-name" className="block text-xs font-medium text-slate-600 mb-1">
              Subject name
            </label>
            <input
              id="edit-subject-name"
              type="text"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
            />
          </div>
          <div>
            <label htmlFor="edit-subject-child" className="block text-xs font-medium text-slate-600 mb-1">
              Child
            </label>
            <select
              id="edit-subject-child"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
            >
              {childrenList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="edit-subject-category" className="block text-xs font-medium text-slate-600 mb-1">
              Category
            </label>
            <select
              id="edit-subject-category"
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
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-lg bg-forest-900 text-white hover:bg-forest-800 disabled:opacity-50"
              disabled={saving || !name.trim() || !childId}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
