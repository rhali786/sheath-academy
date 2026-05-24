'use client'

import { useMemo } from 'react'
import { childColors } from '../theme'
import type { LessonTask } from '@/features/plan/types'
import { getLessonActivityDate } from '@/features/plan/utils/lessonActivityDate'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

interface SubjectActivityProps {
  lessons: LessonTask[]
  subjects: SubjectCourse[]
  children: StudentProfile[]
  selectedChildId: string | null
}

function getWeekRange(): { start: string; end: string } {
  const today = new Date()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)
  const fmt = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }
  return { start: fmt(sunday), end: fmt(saturday) }
}

export function SubjectActivity({ lessons, subjects, children, selectedChildId }: SubjectActivityProps) {
  const { start, end } = useMemo(getWeekRange, [])

  function subjectName(id: string) {
    return subjects.find(s => s.id === id)?.name ?? id
  }

  // Completed lessons this week
  const weekCompleted = lessons.filter(l => {
    if (l.status !== 'completed') return false
    const activityDate = getLessonActivityDate(l)
    return activityDate >= start && activityDate <= end
  })

  const activeChildren = selectedChildId
    ? children.filter(c => c.id === selectedChildId)
    : children

  // Per child: subject → count
  const childSubjectCounts = useMemo(() =>
    activeChildren.map((child, i) => {
      const childLessons = weekCompleted.filter(l => l.childId === child.id)
      const bySubject: Record<string, number> = {}
      childLessons.forEach(l => {
        bySubject[l.subjectId] = (bySubject[l.subjectId] ?? 0) + 1
      })
      return { child, color: childColors[i] || childColors[childColors.length - 1], bySubject }
    }),
    [weekCompleted, activeChildren]
  )

  const hasAny = childSubjectCounts.some(({ bySubject }) => Object.keys(bySubject).length > 0)

  return (
    <section className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
        Subject Activity
      </p>

      {!hasAny ? (
        <p className="text-sm text-slate-400 py-8 text-center">No completed lessons by subject this week.</p>
      ) : (
        <div className="space-y-5">
          {childSubjectCounts.map(({ child, color, bySubject }) => {
            const entries = Object.entries(bySubject)
            if (entries.length === 0) return null
            return (
              <div key={child.id}>
                {!selectedChildId && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <p className="text-xs font-semibold text-slate-600">{child.name}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {entries.map(([subjectId, count]) => (
                    <div
                      key={subjectId}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <span className="text-sm font-semibold text-slate-900" style={{ color }}>
                        {count}
                      </span>
                      <span className="text-xs text-slate-500">{subjectName(subjectId)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
