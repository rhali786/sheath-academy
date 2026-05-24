'use client'

import { useState } from 'react'

export function PlanningDefaultsTab() {
  const [maxLessonsPerDay, setMaxLessonsPerDay] = useState(6)
  const [carryForward, setCarryForward] = useState<'none' | 'next-day' | 'next-week'>('next-day')

  return (
    <section data-testid="settings-panel-planning-defaults">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Planning Defaults</h2>
      <p className="text-sm text-slate-500 mb-6">
        Configure default behavior for the lesson planner.
      </p>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md space-y-4">
          <div>
            <label htmlFor="max-lessons-per-day" className="block text-xs font-medium text-slate-600 mb-1.5">
              Maximum lessons per day
            </label>
            <input
              id="max-lessons-per-day"
              type="number"
              min={1}
              max={20}
              value={maxLessonsPerDay}
              onChange={(e) => setMaxLessonsPerDay(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            />
            <p className="text-xs text-slate-400 mt-1">
              Lessons above this threshold will be flagged as overloaded in the planner.
            </p>
          </div>

          <div>
            <label htmlFor="carry-forward" className="block text-xs font-medium text-slate-600 mb-1.5">
              Carry-forward behavior
            </label>
            <select
              id="carry-forward"
              value={carryForward}
              onChange={(e) => setCarryForward(e.target.value as typeof carryForward)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              <option value="none">Don't carry forward</option>
              <option value="next-day">Move to next school day</option>
              <option value="next-week">Move to next week</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              What happens to incomplete lessons at end of day.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
