'use client'

import React, { useState } from 'react'
import { usePlanner } from '../context/PlannerContext'

export function WeekNavigator() {
  const { selectedWeek, setSelectedWeek, weekStartDay } = usePlanner()
  const [showDatePicker, setShowDatePicker] = useState(false)

  function getWeekRange(): string {
    const d = new Date(selectedWeek)
    const dayOfWeek = d.getDay()
    const offset = weekStartDay === 'Monday' ? dayOfWeek === 0 ? -6 : 1 - dayOfWeek : dayOfWeek
    d.setDate(d.getDate() - offset)

    const start = new Date(d)
    const end = new Date(d)
    end.setDate(end.getDate() + 6)

    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startStr} – ${endStr}`
  }

  function previousWeek() {
    const newDate = new Date(selectedWeek)
    newDate.setDate(newDate.getDate() - 7)
    setSelectedWeek(newDate)
  }

  function nextWeek() {
    const newDate = new Date(selectedWeek)
    newDate.setDate(newDate.getDate() + 7)
    setSelectedWeek(newDate)
  }

  function jumpToToday() {
    setSelectedWeek(new Date())
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const dateStr = e.target.value
    if (dateStr) {
      setSelectedWeek(new Date(dateStr))
      setShowDatePicker(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-white border-b">
      <div className="flex items-center gap-2">
        <button
          onClick={previousWeek}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          aria-label="Previous week"
        >
          ← Previous
        </button>
        <button
          onClick={nextWeek}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          aria-label="Next week"
        >
          Next →
        </button>
      </div>

      <div className="text-sm font-medium text-gray-900">{getWeekRange()}</div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          aria-label="Open date picker"
        >
          📅
        </button>
        {showDatePicker && (
          <input
            type="date"
            value={selectedWeek.toISOString().split('T')[0]}
            onChange={handleDateChange}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md"
          />
        )}
        <button
          onClick={jumpToToday}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          aria-label="Jump to today"
        >
          Today
        </button>
      </div>
    </div>
  )
}
