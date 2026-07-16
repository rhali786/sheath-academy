'use client'

import { useEffect, useState } from 'react'
import { settingsApi } from '@/features/settings/front/services/api'

type CarryForward = 'none' | 'next-day' | 'next-week'

const DEFAULT_MAX_LESSONS_PER_DAY = 6
const DEFAULT_CARRY_FORWARD: CarryForward = 'next-day'

export function PlanningDefaultsTab() {
  const [maxLessonsPerDay, setMaxLessonsPerDay] = useState(DEFAULT_MAX_LESSONS_PER_DAY)
  const [carryForward, setCarryForward] = useState<CarryForward>(DEFAULT_CARRY_FORWARD)
  const [savedMaxLessonsPerDay, setSavedMaxLessonsPerDay] = useState(DEFAULT_MAX_LESSONS_PER_DAY)
  const [savedCarryForward, setSavedCarryForward] = useState<CarryForward>(DEFAULT_CARRY_FORWARD)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    settingsApi
      .getSettings()
      .then((res) => {
        if (cancelled) return
        const data = res.data ?? {}
        const loadedMax = typeof data['planning.maxLessonsPerDay'] === 'number'
          ? (data['planning.maxLessonsPerDay'] as number)
          : DEFAULT_MAX_LESSONS_PER_DAY
        const loadedCarry = typeof data['planning.carryForward'] === 'string'
          ? (data['planning.carryForward'] as CarryForward)
          : DEFAULT_CARRY_FORWARD
        setMaxLessonsPerDay(loadedMax)
        setCarryForward(loadedCarry)
        setSavedMaxLessonsPerDay(loadedMax)
        setSavedCarryForward(loadedCarry)
      })
      .catch(() => {
        // Keep defaults if settings can't be loaded.
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const dirty = maxLessonsPerDay !== savedMaxLessonsPerDay || carryForward !== savedCarryForward

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await settingsApi.updateSettings({
        'planning.maxLessonsPerDay': maxLessonsPerDay,
        'planning.carryForward': carryForward,
      })
      setSavedMaxLessonsPerDay(maxLessonsPerDay)
      setSavedCarryForward(carryForward)
      setSaved(true)
    } catch {
      setError('Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

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
              disabled={loading}
              onChange={(e) => {
                setMaxLessonsPerDay(Number(e.target.value))
                setSaved(false)
              }}
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
              disabled={loading}
              onChange={(e) => {
                setCarryForward(e.target.value as CarryForward)
                setSaved(false)
              }}
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

          {error && <p className="text-red-500 text-xs" data-testid="planning-defaults-error">{error}</p>}
          {saved && !dirty && (
            <p className="text-green-600 text-xs" data-testid="planning-defaults-success">
              Saved.
            </p>
          )}

          <button
            type="button"
            data-testid="planning-defaults-save"
            disabled={!dirty || saving || loading}
            onClick={handleSave}
            className="px-5 py-2.5 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </section>
  )
}
