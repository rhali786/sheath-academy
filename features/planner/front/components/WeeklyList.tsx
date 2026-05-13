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
    <div className="p-4 space-y-2">
      {daySections.map(day => {
        const dayLessons = lessonsForDay(day.dateStr)
        const isExpanded = expandedDays.has(day.dateStr)
        const dateFormatted = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

        return (
          <div
            key={day.dateStr}
            className={`border rounded-lg overflow-hidden ${
              day.isWeekend ? 'border-gray-300 bg-gray-50 opacity-60' : 'border-gray-300 bg-white'
            }`}
          >
            <button
              onClick={() => toggleDay(day.dateStr)}
              className={`w-full flex items-center justify-between p-3 hover:bg-gray-100 ${
                day.isWeekend ? 'bg-gray-100' : 'bg-white'
              }`}
            >
              <div className="text-left">
                <div className="font-semibold text-gray-900">{day.dayLabel}</div>
                <div className="text-sm text-gray-600">{dateFormatted}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{dayLessons.length} lesson(s)</span>
                <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t bg-gray-50 p-3 space-y-2">
                {dayLessons.length > 0 ? (
                  dayLessons.map(lesson => (
                    <div key={lesson.id} className="p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="font-semibold text-gray-900">{lesson.title}</div>
                      <div className="text-sm text-gray-700 mt-1">
                        <span className="inline-block mr-2">Child: {lesson.childId}</span>
                        <span className="inline-block">Subject: {lesson.subjectId}</span>
                      </div>
                      {lesson.description && <div className="text-sm text-gray-600 mt-2">{lesson.description}</div>}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">No lessons scheduled</div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
