'use client'

// F7: Ready to mount in HouseholdSetup — see features-05-10-multitask-opus-haiku-plan.md F7 brief

import { useState, FormEvent, useMemo } from 'react'
import type { TrackingMethod, DayOfWeek } from '@/features/school-year/types'
import { schoolYearApi } from '../services/api'
import { calculatePlannedDaysLocal } from '@/features/school-year/front/lib/calculateDays'

function getDefaultStartDate(): string {
  const now = new Date()
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
  return `${year}-08-01`
}

function getDefaultEndDate(): string {
  const now = new Date()
  const year = now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear()
  return `${year}-05-31`
}

const DEFAULT_SCHOOL_DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri']

interface SchoolYearFormProps {
  onSuccess?: () => void
  /** Flat bordered panel for embedded contexts (e.g. Settings) instead of shadow card. */
  embedded?: boolean
}

export function SchoolYearForm({ onSuccess, embedded }: SchoolYearFormProps) {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(getDefaultStartDate())
  const [endDate, setEndDate] = useState(getDefaultEndDate())
  const [trackingMethod, setTrackingMethod] = useState<TrackingMethod>('days')
  const [requiredDays, setRequiredDays] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Live preview: count planned school days from the selected dates
  const livePreviewDays = useMemo(() => {
    if (!startDate || !endDate || startDate >= endDate) return null
    return calculatePlannedDaysLocal({
      startDate,
      endDate,
      schoolDays: DEFAULT_SCHOOL_DAYS,
    })
  }, [startDate, endDate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (startDate >= endDate) {
      setError('End date must be after start date')
      return
    }

    setSaving(true)
    try {
      await schoolYearApi.createSchoolYear({
        name: name.trim(),
        startDate,
        endDate,
        isActive: true,
      })
      setName('')
      onSuccess?.()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={
        embedded
          ? 'bg-white rounded-xl border border-slate-200 p-6 w-full max-w-md'
          : 'bg-white rounded-2xl shadow-lg p-8 w-full max-w-md'
      }
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Set up your school year</h2>
        <p className="text-sm text-slate-500 mt-1">
          Define the name and dates for your current school year.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="school-year-name"
            className="block text-xs font-medium text-slate-600 mb-1.5"
          >
            School year name
          </label>
          <input
            id="school-year-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. 2025–2026"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            maxLength={80}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="school-year-start"
              className="block text-xs font-medium text-slate-600 mb-1.5"
            >
              Start date
            </label>
            <input
              id="school-year-start"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            />
          </div>

          <div>
            <label
              htmlFor="school-year-end"
              className="block text-xs font-medium text-slate-600 mb-1.5"
            >
              End date
            </label>
            <input
              id="school-year-end"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="tracking-method"
            className="block text-xs font-medium text-slate-600 mb-1.5"
          >
            Tracking method
          </label>
          <select
            id="tracking-method"
            value={trackingMethod}
            onChange={e => setTrackingMethod(e.target.value as TrackingMethod)}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
          >
            <option value="days">Days only</option>
            <option value="hours">Hours only</option>
            <option value="days-hours">Days + hours</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="required-school-days"
            className="block text-xs font-medium text-slate-600 mb-1.5"
          >
            Required school days <span className="text-slate-400">(optional)</span>
          </label>
          <input
            id="required-school-days"
            type="number"
            min={1}
            max={400}
            value={requiredDays}
            onChange={e => setRequiredDays(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g. 180"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
          />
        </div>

        {/* Live preview */}
        {livePreviewDays !== null && (
          <div
            className="rounded-lg bg-forest-50 border border-forest-100 px-4 py-3 text-xs text-forest-900"
            data-testid="school-year-live-preview"
          >
            <span className="font-semibold">{livePreviewDays}</span> planned school days
            {typeof requiredDays === 'number' && requiredDays > 0 && (
              <span className="ml-1">
                · {livePreviewDays >= requiredDays ? (
                  <span className="text-green-700">On track ✓</span>
                ) : (
                  <span className="text-amber-700">Short by {requiredDays - livePreviewDays} days</span>
                )}
              </span>
            )}
          </div>
        )}

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save school year'}
        </button>
      </form>
    </div>
  )
}
