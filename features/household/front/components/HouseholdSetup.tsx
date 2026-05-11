'use client'

import { useState, FormEvent } from 'react'
import { householdApi } from '../services/api'
import { useHousehold } from '../context'

export function HouseholdSetup() {
  const { refetch } = useHousehold()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await householdApi.setup(name.trim())
      refetch()
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="mb-6">
          <div className="w-12 h-12 rounded-xl bg-forest-900 flex items-center justify-center mb-4">
            <span className="text-white text-xl font-bold leading-none" aria-hidden="true">ش</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Welcome to Sheath Academy</h1>
          <p className="text-sm text-slate-500 mt-1">
            What would you like to call your household? This appears throughout your dashboard.
            You can rename it any time in Settings.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="household-name" className="block text-xs font-medium text-slate-600 mb-1.5">
            Household name
          </label>
          <input
            id="household-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ahmed Academy"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900 mb-4"
            autoFocus
            maxLength={80}
          />
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="w-full py-3 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Setting up…' : 'Set up my household'}
          </button>
        </form>
      </div>
    </div>
  )
}
