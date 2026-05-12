'use client'

import React, { useState, FormEvent } from 'react'
import { SetupCard } from './SetupCard'

interface SetupCard_SchoolYearProps {
  onSchoolYearCreated?: () => void
}

export function SetupCard_SchoolYear({ onSchoolYearCreated }: SetupCard_SchoolYearProps) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !startDate || !endDate) {
      setError('All fields are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/school-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), startDate, endDate, isActive: true }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { message?: string }).message || 'Failed to create school year')
      }
      onSchoolYearCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  if (showForm) {
    return (
      <div
        data-testid="setup-card-school-year"
        className="bg-white rounded-xl border border-slate-200 p-6"
      >
        <h2 className="text-base font-semibold text-slate-900 mb-1">Set up your school year</h2>
        <p className="text-sm text-slate-500 mb-4">
          Define your academic year so you can organise lessons and track attendance.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="sy-name" className="block text-xs font-medium text-slate-600 mb-1">
              Year name *
            </label>
            <input
              id="sy-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 2025–2026"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
              maxLength={80}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sy-start" className="block text-xs font-medium text-slate-600 mb-1">
                Start date *
              </label>
              <input
                id="sy-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
              />
            </div>
            <div>
              <label htmlFor="sy-end" className="block text-xs font-medium text-slate-600 mb-1">
                End date *
              </label>
              <input
                id="sy-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !startDate || !endDate}
              className="flex-1 px-3 py-2 rounded-lg bg-forest-900 text-white text-sm font-medium hover:bg-forest-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save school year'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <SetupCard
      testId="setup-card-school-year"
      title="Set up your school year"
      description="Define your academic year dates to organise lessons and track progress."
      actionLabel="Set up school year"
      onAction={() => setShowForm(true)}
    />
  )
}
