'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePlanner } from '../context/PlannerContext'
import type { LessonTask, LessonTaskStatus } from '@/features/plan/types'
import type { StudentProfile } from '@/features/lib/types'
import { lessonSpansDate } from '@/features/plan/utils/lessonCompletionWindow'

const STATUS_BADGE: Record<LessonTaskStatus, string> = {
  not_started: 'bg-slate-100 text-slate-600',
  completed:   'bg-green-100 text-green-700',
  skipped:     'bg-amber-100 text-amber-700',
}
const STATUS_LABEL: Record<LessonTaskStatus, string> = {
  not_started: 'Not started',
  completed:   'Completed',
  skipped:     'Skipped',
}

const DURATION_LABEL: Record<string, string> = {
  '15min': '15 min',
  '30min': '30 min',
  '45min': '45 min',
  '1hr':   '1 hr',
  custom:  'Custom',
}

// Deterministic per-learner accent color for the "learner spine" rail. StudentProfile does not
// yet carry a stored displayColor (only the children/schema layer has it — out of this phase's
// file scope), so we derive a stable index from the learner id instead of positional order.
const LEARNER_SPINE_COLORS = ['#1a5c3a', '#0284c7', '#b45309', '#7c3aed', '#be123c', '#0f766e']

function learnerColor(learnerId: string): string {
  let hash = 0
  for (let i = 0; i < learnerId.length; i++) {
    hash = (hash * 31 + learnerId.charCodeAt(i)) >>> 0
  }
  return LEARNER_SPINE_COLORS[hash % LEARNER_SPINE_COLORS.length]
}

function learnerInitial(learner: StudentProfile): string {
  if (learner.avatarInitials) return learner.avatarInitials
  return learner.name.trim().charAt(0).toUpperCase() || '?'
}

function getDayOfWeekLabel(dayIndex: number): string {
  const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return labels[dayIndex]
}

function isWeekend(dayIndex: number): boolean {
  return dayIndex === 0 || dayIndex === 6
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function normalizeDateOnly(date: Date): Date {
  const dateStr = date.toISOString().slice(0, 10)
  return new Date(`${dateStr}T00:00:00`)
}

interface DaySection {
  dateStr: string
  date: Date
  dayLabel: string
  isWeekend: boolean
}

export function WeeklyPlanner() {
  const { lessons, selectedWeek, weekStartDay, children, subjects, selectedChildIds, selectedSubjectIds } = usePlanner()
  const router = useRouter()
  const [collapsedLearnerIds, setCollapsedLearnerIds] = useState<Set<string>>(new Set())

  const d = normalizeDateOnly(selectedWeek)
  const dayOfWeek = d.getDay()
  const daysFromMonday = weekStartDay === 'Monday'
    ? (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
    : dayOfWeek
  d.setDate(d.getDate() - daysFromMonday)
  const weekStart = new Date(d)

  const orderedDays = Array.from({ length: 7 }, (_, i) =>
    new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i),
  )

  const daySections: DaySection[] = orderedDays.map(date => {
    const dow = date.getDay()
    return {
      dateStr: formatLocalDate(date),
      date,
      dayLabel: getDayOfWeekLabel(dow),
      isWeekend: isWeekend(dow),
    }
  })

  const learners = children.filter(c => selectedChildIds.includes(c.id))

  function toggleLearner(id: string) {
    setCollapsedLearnerIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function resolveSubjectName(subjectId: string): string {
    return subjects.find(s => s.id === subjectId)?.name ?? subjectId
  }

  function lessonsForLearner(learnerId: string): LessonTask[] {
    return lessons.filter(l => l.childId === learnerId && selectedSubjectIds.includes(l.subjectId))
  }

  function lessonsForLearnerDay(learnerId: string, dateStr: string): LessonTask[] {
    return lessons.filter(
      l => l.childId === learnerId && selectedSubjectIds.includes(l.subjectId) && lessonSpansDate(l, dateStr),
    )
  }

  return (
    <div className="space-y-4">
      {learners.map(learner => {
        const isCollapsed = collapsedLearnerIds.has(learner.id)
        const color = learnerColor(learner.id)
        const learnerLessons = lessonsForLearner(learner.id)

        return (
          <div
            key={learner.id}
            data-learner-section
            className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden"
            style={{ borderLeftWidth: 4, borderLeftColor: color }}
          >
            <button
              type="button"
              onClick={() => toggleLearner(learner.id)}
              aria-expanded={!isCollapsed}
              aria-label={learner.name}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold text-white shrink-0"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                >
                  {learnerInitial(learner)}
                </span>
                <span className="font-semibold text-slate-900">{learner.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {isCollapsed && (
                  <span className="text-xs text-slate-500">
                    {learnerLessons.length} {learnerLessons.length === 1 ? 'lesson' : 'lessons'} this week
                  </span>
                )}
                <span className={`text-lg text-slate-500 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
                  ▼
                </span>
              </div>
            </button>

            {!isCollapsed && (
              learnerLessons.length === 0 ? (
                <div className="px-4 pb-4 text-sm text-slate-500 border-t border-slate-100 pt-3">
                  No lessons this week
                </div>
              ) : (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                  {daySections.map(day => {
                    const dayLessons = lessonsForLearnerDay(learner.id, day.dateStr)

                    if (dayLessons.length === 0) {
                      return (
                        <div
                          key={day.dateStr}
                          data-testid={`day-empty-${learner.id}-${day.dateStr}`}
                          className="text-xs text-slate-400 py-1"
                        >
                          <div className="uppercase tracking-wide">{day.dayLabel}</div>
                          <div className="mt-1 opacity-60">—</div>
                        </div>
                      )
                    }

                    return (
                      <div key={day.dateStr} data-testid={`day-lessons-${learner.id}-${day.dateStr}`}>
                        <div className="text-xs uppercase tracking-wide text-slate-400 mb-1.5">{day.dayLabel}</div>
                        <div className="space-y-2">
                          {dayLessons.map(lesson => (
                            <div
                              key={lesson.id}
                              data-lesson-card
                              onClick={() => router.push(`/lessons?editId=${lesson.id}`)}
                              className="p-3 bg-white rounded-lg border border-forest-200 hover:shadow-md transition-shadow cursor-pointer"
                            >
                              <div className="text-xs font-medium text-forest-700 uppercase tracking-wide">
                                {resolveSubjectName(lesson.subjectId)}
                              </div>
                              <div className="font-semibold text-forest-900 text-sm mt-0.5">{lesson.title}</div>
                              <div className="mt-2 flex items-center flex-wrap gap-2">
                                <span
                                  data-testid="status-badge"
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[lesson.status]}`}
                                >
                                  {STATUS_LABEL[lesson.status]}
                                </span>
                                {lesson.resourceLink && (
                                  <span
                                    data-testid="resource-indicator"
                                    aria-label="Has resource link"
                                    title="Has resource link"
                                    className="text-xs text-slate-500"
                                  >
                                    📎
                                  </span>
                                )}
                                {lesson.estimatedDuration && (
                                  <span className="text-xs text-slate-400">
                                    {DURATION_LABEL[lesson.estimatedDuration] ?? lesson.estimatedDuration}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}
