'use client'

import { useState } from 'react'
import { usePlanner } from '../context/PlannerContext'

function getDayOfWeekLabel(dayIndex: number): string {
  const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return labels[dayIndex]
}

function isWeekend(dayIndex: number): boolean {
  return dayIndex === 0 || dayIndex === 6
}

interface DaySection {
  dateStr: string
  date: Date
  dayLabel: string
  isWeekend: boolean
}

export function WeeklyList() {
  const { lessons, selectedWeek, weekStartDay } = usePlanner()
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  // Calculate week start date
  const d = new Date(selectedWeek)
  const dayOfWeek = d.getDay()
  const offset = weekStartDay === 'Monday' ? (dayOfWeek === 0 ? -6 : 1 - dayOfWeek) : dayOfWeek
  d.setDate(d.getDate() - offset)
  const weekStart = new Date(d)

  // Get all days of the week
  const orderedDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return date
  })

  const daySections: DaySection[] = orderedDays.map(date => {
    const dayOfWeek = date.getDay()
    const dateStr = date.toISOString().split('T')[0]
    const dayLabel = getDayOfWeekLabel(dayOfWeek)
    return {
      dateStr,
      date,
      dayLabel,
      isWeekend: isWeekend(dayOfWeek),
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

  const lessonsForDay = (dateStr: string) => lessons.filter(l => l.dueDate === dateStr)

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
                    <div key={lesson.id} className="p-4 bg-white rounded-lg border border-forest-200 hover:shadow-md transition-shadow">
                      <div className="font-semibold text-forest-900">{lesson.title}</div>
                      <div className="text-sm text-slate-600 mt-2 space-y-1">
                        <div>Child: <span className="font-medium text-slate-900">{lesson.childId}</span></div>
                        <div>Subject: <span className="font-medium text-slate-900">{lesson.subjectId}</span></div>
                      </div>
                      {lesson.description && <div className="text-sm text-slate-700 mt-3 p-3 bg-forest-50 rounded border border-forest-100">{lesson.description}</div>}
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
