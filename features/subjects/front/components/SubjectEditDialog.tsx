'use client'

import { useEffect, useState, FormEvent } from 'react'
import type { SubjectCourse, SubjectCourseCategory } from '@/features/subjects/types'
import type { Resource } from '@/features/resources/types'
import { SUBJECT_COURSE_CATEGORIES, formatCategory } from '@/features/subjects/front/lib/categories'
import { subjectsApi } from '@/features/subjects/front/services/api'
import { resourcesApi } from '@/features/resources/front/services/api'

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
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<string[]>([])
  const [category, setCategory] = useState<SubjectCourseCategory>('Math')
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !subject) return
    setName(subject.name)
    setSelectedLearnerIds(subject.learnerIds?.length ? [...subject.learnerIds] : subject.childId ? [subject.childId] : [])
    setCategory(subject.category)
    setSelectedResourceIds(subject.resourceIds ? [...subject.resourceIds] : [])
    setError(null)
  }, [open, subject])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    resourcesApi
      .listResources()
      .then((res) => {
        if (!cancelled) setResources(res.data || [])
      })
      .catch(() => {
        if (!cancelled) setResources([])
      })
    return () => {
      cancelled = true
    }
  }, [open])

  if (!open || !subject) return null

  function toggleLearner(id: string) {
    setSelectedLearnerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function toggleResource(id: string) {
    setSelectedResourceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!subject) return
    setError(null)
    if (!name.trim() || selectedLearnerIds.length === 0) {
      setError('Name and at least one learner are required.')
      return
    }
    setSaving(true)
    try {
      await subjectsApi.updateSubject(subject.id, {
        name: name.trim(),
        learnerIds: selectedLearnerIds,
        category,
        resourceIds: selectedResourceIds,
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
          Edit course
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3" data-testid="subject-edit-form">
          <div>
            <label htmlFor="edit-subject-name" className="block text-xs font-medium text-slate-600 mb-1">
              Course name
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
            <p className="block text-xs font-medium text-slate-600 mb-1.5">Learner(s)</p>
            <div className="flex flex-wrap gap-2" data-testid="edit-subject-learners">
              {childrenList.map((c) => (
                <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLearnerIds.includes(c.id)}
                    onChange={() => toggleLearner(c.id)}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">{c.name}</span>
                </label>
              ))}
            </div>
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
                  {formatCategory(c)}
                </option>
              ))}
            </select>
          </div>
          {resources.length > 0 && (
            <div>
              <p className="block text-xs font-medium text-slate-600 mb-1.5">Linked resources</p>
              <div className="flex flex-col gap-2" data-testid="edit-subject-resources">
                {resources.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={selectedResourceIds.includes(r.id)}
                      onChange={() => toggleResource(r.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700">{r.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
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
              disabled={saving || !name.trim() || selectedLearnerIds.length === 0}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
