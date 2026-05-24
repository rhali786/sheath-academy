'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { plannerApi } from '@/features/plan/front/services/api'
import { subjectsApi } from '@/features/subjects/front/services/api'
import type { LessonTask } from '@/features/plan/types'
import { childScopedHref } from '@/features/lib/front/navigation'

interface NowNextCardProps {
  selectedChildId?: string | null
}

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function NowNextCard({ selectedChildId }: NowNextCardProps) {
  const [next, setNext] = useState<LessonTask | null | undefined>(undefined)
  const [subjectName, setSubjectName] = useState<string>('')

  useEffect(() => {
    const today = todayLocal()
    const childIds = selectedChildId ? [selectedChildId] : undefined
    plannerApi.getLessons(undefined, childIds)
      .then(lessons => {
        const upcoming = lessons
          .filter(l => l.status === 'not_started' && l.dueDate >= today)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        setNext(upcoming[0] ?? null)
      })
      .catch(() => setNext(null))
  }, [selectedChildId])

  useEffect(() => {
    if (!next?.subjectId) return
    subjectsApi.getSubjects()
      .then(res => {
        const s = res.data.find((s: { id: string }) => s.id === next.subjectId)
        setSubjectName(s?.name ?? '')
      })
      .catch(() => {})
  }, [next?.subjectId])

  if (next === undefined) return null

  if (next === null) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5" data-testid="now-next-card">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Now & Next</p>
        <p className="text-sm text-slate-400">No upcoming lessons planned.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5" data-testid="now-next-card">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Now & Next</p>
      <div className="space-y-1">
        {subjectName && (
          <p className="text-xs font-medium text-forest-700 uppercase tracking-wide">{subjectName}</p>
        )}
        <p className="text-sm font-semibold text-slate-900">{next.title}</p>
        <p className="text-xs text-slate-400">{next.dueDate}</p>
      </div>
      <Link
        href={childScopedHref('/lessons', selectedChildId)}
        className="mt-3 inline-block text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
      >
        View lessons →
      </Link>
    </div>
  )
}
