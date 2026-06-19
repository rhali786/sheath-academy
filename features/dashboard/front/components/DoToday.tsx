'use client'

import { useRouter } from 'next/navigation'
import { useContext_Dashboard } from '../context/DashboardProvider'
import { TodayLessonCard } from '@/features/plan/front/components/TodayLessonCard'

function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function DoToday() {
  const { selectedChildId, children } = useContext_Dashboard()
  const router = useRouter()
  const today = todayLocal()

  const activeChildren = selectedChildId
    ? children.filter(c => c.id === selectedChildId)
    : children

  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900 mb-5">Do Today</h2>
      <TodayLessonCard
        children={activeChildren}
        today={today}
        onEditLesson={id => router.push('/lessons?editId=' + id)}
      />
    </section>
  )
}
