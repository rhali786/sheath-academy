'use client'

import { useState } from 'react'
import { useContext_Dashboard } from '../context/DashboardProvider'
import { TodayLessonCard } from '@/features/plan/front/components/TodayLessonCard'
import { EditLessonModal } from './EditLessonModal'

function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function DoToday() {
  const { selectedChildId, children } = useContext_Dashboard()
  const today = todayLocal()
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  // Bumped after a save to force TodayLessonCard to remount and re-fetch,
  // since it owns its own internal fetch and has no external refresh hook.
  const [refreshCount, setRefreshCount] = useState(0)

  const activeChildren = selectedChildId
    ? children.filter(c => c.id === selectedChildId)
    : children

  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900 mb-5">Do Today</h2>
      <TodayLessonCard
        key={refreshCount}
        children={activeChildren}
        today={today}
        onEditLesson={id => setEditingLessonId(id)}
      />
      {editingLessonId && (
        <EditLessonModal
          lessonId={editingLessonId}
          onClose={() => setEditingLessonId(null)}
          onSaved={() => setRefreshCount(c => c + 1)}
        />
      )}
    </section>
  )
}
