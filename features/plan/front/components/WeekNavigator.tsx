'use client'

import React, { useState } from 'react'
import { usePlanner } from '../context/PlannerContext'

export function WeekNavigator() {
  const { selectedWeek, setSelectedWeek, weekStartDay } = usePlanner()
  const [showDatePicker, setShowDatePicker] = useState(false)

  function normalizeDateOnly(date: Date): Date {
    const dateStr = date.toISOString().slice(0, 10)
    return new Date(`${dateStr}T00:00:00`)
  }

  function formatDateInputValue(date: Date): string {
    return date.toISOString().slice(0, 10)
  }

  function getWeekRange(): string {
    const d = normalizeDateOnly(selectedWeek)
    const dayOfWeek = d.getDay()
    const daysFromStart = weekStartDay === 'Monday' ? (dayOfWeek === 0 ? 6 : dayOfWeek - 1) : dayOfWeek
    d.setDate(d.getDate() - daysFromStart)

    const start = new Date(d)
    const end = new Date(d)
    end.setDate(end.getDate() + 6)

    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startStr} – ${endStr}`
  }

  function previousWeek() {
    const newDate = normalizeDateOnly(selectedWeek)
    newDate.setDate(newDate.getDate() - 7)
    setSelectedWeek(newDate)
  }

  function nextWeek() {
    const newDate = normalizeDateOnly(selectedWeek)
    newDate.setDate(newDate.getDate() + 7)
    setSelectedWeek(newDate)
  }

  function jumpToToday() {
    setSelectedWeek(new Date())
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const dateStr = e.target.value
    if (dateStr) {
      setSelectedWeek(new Date(`${dateStr}T00:00:00`))
      setShowDatePicker(false)
    }
  }

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={previousWeek}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2 transition-colors"
              aria-label="Previous week"
            >
              ← Previous
            </button>
            <button
              onClick={nextWeek}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2 transition-colors"
              aria-label="Next week"
            >
              Next →
            </button>
          </div>

          <div className="text-base font-semibold text-slate-900">{getWeekRange()}</div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2 transition-colors"
              aria-label="Open date picker"
            >
              📅
            </button>
            {showDatePicker && (
              <input
                type="date"
                value={formatDateInputValue(selectedWeek)}
                onChange={handleDateChange}
                className="px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2"
              />
            )}
            <button
              onClick={jumpToToday}
              className="px-4 py-2.5 text-sm font-medium text-white bg-forest-900 border border-forest-900 rounded-lg hover:bg-forest-800 hover:border-forest-800 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2 transition-colors"
              aria-label="Jump to today"
            >
              Today
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
