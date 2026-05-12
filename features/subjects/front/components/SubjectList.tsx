'use client'

import { useEffect, useState } from 'react'
import type { SubjectCourse } from '@/features/subjects/types'
import { subjectsApi } from '@/features/subjects/front/services/api'

export interface SubjectListProps {
  childId: string
  /** Refetch when this key changes (e.g. bump after create) */
  refreshKey?: number
}

export function SubjectList({ childId, refreshKey = 0 }: SubjectListProps) {
  const [subjects, setSubjects] = useState<SubjectCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)

  useEffect(() => {
    if (!childId) {
      setSubjects([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    subjectsApi
      .getSubjects(childId)
      .then((res) => {
        if (cancelled) return
        const active = (res.data ?? []).filter((s) => s.isActive !== false)
        setSubjects(active)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load subjects')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [childId, refreshKey])

  async function handleArchive(id: string) {
    setArchivingId(id)
    try {
      await subjectsApi.archiveSubject(id)
      setSubjects((prev) => prev.filter((s) => s.id !== id))
    } finally {
      setArchivingId(null)
    }
  }

  if (!childId) {
    return null
  }

  if (loading) {
    return <p className="text-sm text-slate-500" data-testid="subject-list-loading">Loading subjects…</p>
  }

  if (error) {
    return <p className="text-sm text-red-600" data-testid="subject-list-error">{error}</p>
  }

  if (subjects.length === 0) {
    return <p className="text-sm text-slate-500" data-testid="subject-list-empty">No subjects yet for this child.</p>
  }

  return (
    <ul className="mt-3 space-y-2" data-testid="subject-list">
      {subjects.map((s) => (
        <li
          key={s.id}
          className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
        >
          <span>
            <span className="font-medium text-slate-800">{s.name}</span>
            <span className="text-slate-400 ml-2 text-xs">{s.category}</span>
          </span>
          <button
            type="button"
            className="text-xs text-slate-500 hover:text-red-600"
            disabled={archivingId === s.id}
            onClick={() => handleArchive(s.id)}
          >
            {archivingId === s.id ? '…' : 'Archive'}
          </button>
        </li>
      ))}
    </ul>
  )
}
