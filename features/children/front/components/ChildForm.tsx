'use client'

import { useState, FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { StudentProfile } from '@/features/lib/types'

const GRADE_OPTIONS = [
  'PK', 'K',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
  'Other/custom',
]

interface ChildFormProps {
  householdId: string
  child?: StudentProfile | null
  onSubmit: (data: Partial<StudentProfile> & { householdId: string; name: string; gradeLabel: string; username: string; password: string }) => Promise<void>
  onCancel: () => void
}

export function ChildForm({ householdId, child, onSubmit, onCancel }: ChildFormProps) {
  const [firstName, setFirstName] = useState(child?.firstName || '')
  const [lastName, setLastName] = useState(child?.lastName || '')
  const [gradeLabel, setGradeLabel] = useState(child?.gradeLabel || '')
  const [dob, setDob] = useState(child?.dob || '')
  const [learnerLoginEnabled, setLearnerLoginEnabled] = useState(
    child?.learnerLoginEnabled !== undefined ? child.learnerLoginEnabled : (child ? !!child.username : false)
  )
  const [username, setUsername] = useState(child?.username || '')
  const [password, setPassword] = useState(child?.password || '')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !gradeLabel.trim()) {
      setError('Please fill in all required fields')
      return
    }
    if (learnerLoginEnabled && (!username.trim() || !password.trim())) {
      setError('Please fill in all required fields')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        householdId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        gradeLabel: gradeLabel.trim(),
        dob: dob || undefined,
        learnerLoginEnabled,
        username: learnerLoginEnabled ? username.trim() : '',
        password: learnerLoginEnabled ? password.trim() : '',
      })
      setFirstName('')
      setLastName('')
      setGradeLabel('')
      setDob('')
      setLearnerLoginEnabled(false)
      setUsername('')
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="block text-xs font-medium text-slate-600 mb-1.5">
            First name *
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="e.g. Adam"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            maxLength={80}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-xs font-medium text-slate-600 mb-1.5">
            Last name *
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="e.g. Al-Rashid"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            maxLength={80}
          />
        </div>
      </div>
      <p className="text-xs text-slate-400 -mt-2">Names entered here may appear on reports, transcripts, and exported records.</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="gradeLabel" className="block text-xs font-medium text-slate-600 mb-1.5">
            Grade/Level *
          </label>
          <select
            id="gradeLabel"
            value={gradeLabel}
            onChange={(e) => setGradeLabel(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
          >
            <option value="">Select grade...</option>
            {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="dob" className="block text-xs font-medium text-slate-600 mb-1.5">
            Date of birth
          </label>
          <input
            id="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            id="learnerLoginEnabled"
            type="checkbox"
            checked={learnerLoginEnabled}
            onChange={(e) => setLearnerLoginEnabled(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs font-medium text-slate-600">Allow learner to sign in</span>
        </label>
      </div>

      {learnerLoginEnabled && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-slate-600 mb-1.5">
              Username *
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. adam.student"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
              maxLength={50}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-slate-600 mb-1.5">
              Password *
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 pr-9 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
                maxLength={100}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-xs">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-3 py-2 rounded-lg bg-forest-900 text-white text-sm font-medium hover:bg-forest-800 disabled:opacity-50 transition-colors"
        >
          {saving ? (child ? 'Saving...' : 'Adding...') : child ? 'Save changes' : 'Add child'}
        </button>
      </div>
    </form>
  )
}
