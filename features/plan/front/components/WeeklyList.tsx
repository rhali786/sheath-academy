'use client'

import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePlanner } from '../context/PlannerContext'
import type { LessonTaskStatus } from '@/features/plan/types'
import { formatCompletionWindow, lessonSpansDate } from '@/features/plan/utils/lessonCompletionWindow'

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

export function WeeklyList() {
  const { lessons, selectedWeek, weekStartDay, children, subjects } = usePlanner()
  const router = useRouter()
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  // Calculate week start date using local date methods to avoid UTC shift
  const d = normalizeDateOnly(selectedWeek)
  const dayOfWeek = d.getDay()
  // daysFromMonday: Mon=0, Tue=1, ..., Sat=5, Sun=6
  const daysFromMonday = weekStartDay === 'Monday'
    ? (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
    : dayOfWeek
  d.setDate(d.getDate() - daysFromMonday)
  const weekStart = new Date(d)

  const orderedDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)
    return date
  })

  const daySections: DaySection[] = orderedDays.map(date => {
    const dow = date.getDay()
    const dateStr = formatLocalDate(date)
    return {
      dateStr,
      date,
      dayLabel: getDayOfWeekLabel(dow),
      isWeekend: isWeekend(dow),
    }
  })

  function toggleDay(dateStr: string) {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(dateStr)) {
      newExpanded.delete(dateStr)
    } else {
      newExpanded.add(dateStr)
    }
    setExpandedDays(newExpanded)
  }

  const lessonsForDay = (dateStr: string) => lessons.filter(l => lessonSpansDate(l, dateStr))

  function resolveChildName(childId: string): string {
    return children.find(c => c.id === childId)?.name ?? childId
  }

  function resolveSubjectName(subjectId: string): string {
    return subjects.find(s => s.id === subjectId)?.name ?? subjectId
  }

  return (
    <div className="space-y-3">
      {daySections.map(day => {
        const dayLessons = lessonsForDay(day.dateStr)
        const isExpanded = expandedDays.has(day.dateStr)
        const dateFormatted = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

        return (
          <div
            key={day.dateStr}
            className={`rounded-lg border shadow-sm overflow-hidden transition-all ${
              day.isWeekend ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-slate-200 bg-white hover:shadow-md'
            }`}
          >
            <button
              onClick={() => toggleDay(day.dateStr)}
              className={`w-full flex items-center justify-between px-4 py-4 transition-colors ${
                day.isWeekend ? 'hover:bg-slate-100' : 'hover:bg-slate-50'
              }`}
            >
              <div className="text-left flex-1">
                <div className={`font-semibold ${day.isWeekend ? 'text-slate-600' : 'text-slate-900'}`}>{day.dayLabel}</div>
                <div className={`text-sm ${day.isWeekend ? 'text-slate-500' : 'text-slate-600'}`}>{dateFormatted}</div>
              </div>
              <div className="flex items-center gap-3 ml-2">
                <span className={`text-xs font-medium ${day.isWeekend ? 'text-slate-500' : 'text-slate-600'}`}>
                  {dayLessons.length} {dayLessons.length === 1 ? 'lesson' : 'lessons'}
                </span>
                <span className={`text-lg transition-transform ${isExpanded ? 'rotate-180' : ''} ${day.isWeekend ? 'text-slate-500' : 'text-slate-700'}`}>
                  ▼
                </span>
              </div>
            </button>

            {isExpanded && (
              <div className={`border-t px-4 py-4 space-y-3 ${day.isWeekend ? 'bg-slate-50' : 'bg-slate-50'}`}>
                {dayLessons.length > 0 ? (
                  dayLessons.map(lesson => (
                    <div key={lesson.id} onClick={() => router.push(`/lessons?editId=${lesson.id}`)} className="p-4 bg-white rounded-lg border border-forest-200 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-forest-900">{lesson.title}</div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[lesson.status]}`}>
                            {STATUS_LABEL[lesson.status]}
                          </span>
                          <span aria-label="Tap to edit or reschedule" title="Tap to edit or reschedule" className="text-slate-300">
                            <Pencil className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 mt-2 space-y-1">
                        <div>Child: <span className="font-medium text-slate-900">{resolveChildName(lesson.childId)}</span></div>
                        <div>Subject: <span className="font-medium text-slate-900">{resolveSubjectName(lesson.subjectId)}</span></div>
                      </div>
                      {lesson.description && <div className="text-sm text-slate-700 mt-3 p-3 bg-forest-50 rounded border border-forest-100">{lesson.description}</div>}
                      {formatCompletionWindow(lesson) && (
                        <div className="text-xs text-forest-600 mt-2">{formatCompletionWindow(lesson)}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500">No lessons scheduled</div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
