'use client'

// F7: Ready to mount in HouseholdSetup — see features-05-10-multitask-opus-haiku-plan.md F7 brief

import { useState, FormEvent } from 'react'
import { schoolYearApi } from '../services/api'

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

interface SchoolYearFormProps {
  onSuccess?: () => void
}

export function SchoolYearForm({ onSuccess }: SchoolYearFormProps) {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(getDefaultStartDate())
  const [endDate, setEndDate] = useState(getDefaultEndDate())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      await schoolYearApi.createSchoolYear({ name: name.trim(), startDate, endDate })
      onSuccess?.()
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Set up your school year</h2>
        <p className="text-sm text-slate-500 mt-1">
          Define the name and dates for your current school year.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
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

        <div className="mb-4">
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

        <div className="mb-4">
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

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

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
