'use client'

import { useEffect, useState, useMemo } from 'react'
import type { SubjectCourse } from '@/features/subjects/types'
import { subjectsApi } from '@/features/subjects/front/services/api'
import { SubjectEditDialog, type SubjectChildOption } from './SubjectEditDialog'

export interface SubjectsAllTableProps {
  childrenList: SubjectChildOption[]
  refreshKey?: number
  onMutate?: () => void
}

export function SubjectsAllTable({ childrenList, refreshKey = 0, onMutate }: SubjectsAllTableProps) {
  const [rows, setRows] = useState<SubjectCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<SubjectCourse | null>(null)
  const [listVersion, setListVersion] = useState(0)

  const childName = useMemo(() => {
    const m = new Map(childrenList.map((c) => [c.id, c.name]))
    return (id: string) => m.get(id) ?? id
  }, [childrenList])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    subjectsApi
      .getSubjects()
      .then((res) => {
        if (cancelled) return
        const active = (res.data ?? []).filter((s) => s.isActive !== false)
        const sorted = [...active].sort((a, b) => {
          const an = childName(a.childId).localeCompare(childName(b.childId))
          if (an !== 0) return an
          return a.name.localeCompare(b.name)
        })
        setRows(sorted)
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
  }, [refreshKey, listVersion, childName])

  async function handleArchive(id: string) {
    setArchivingId(id)
    try {
      await subjectsApi.archiveSubject(id)
      setRows((prev) => prev.filter((s) => s.id !== id))
      onMutate?.()
    } finally {
      setArchivingId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500" data-testid="subjects-all-loading">Loading subjects…</p>
  }

  if (error) {
    return <p className="text-sm text-red-600" data-testid="subjects-all-error">{error}</p>
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-500" data-testid="subjects-all-empty">
        No subjects yet. Add one above for any child.
      </p>
    )
  }

  return (
    <>
      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white" data-testid="subjects-all-table">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-600 uppercase tracking-wide">
              <th className="px-4 py-3">Child</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-slate-800">{childName(s.childId)}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-3 text-slate-600">{s.category}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    type="button"
                    className="text-xs font-medium text-forest-900 hover:text-forest-700 mr-3"
                    onClick={() => setEditing(s)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs text-slate-500 hover:text-red-600"
                    disabled={archivingId === s.id}
                    onClick={() => handleArchive(s.id)}
                  >
                    {archivingId === s.id ? '…' : 'Archive'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubjectEditDialog
        open={editing !== null}
        subject={editing}
        childrenList={childrenList}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setListVersion((v) => v + 1)
          onMutate?.()
        }}
      />
    </>
  )
}
