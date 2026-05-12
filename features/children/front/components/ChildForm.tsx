'use client'

import { useState, FormEvent, useEffect } from 'react'
import type { StudentProfile } from '@/features/lib/types'

interface ChildFormProps {
  householdId: string
  child?: StudentProfile | null
  onSubmit: (data: Partial<StudentProfile> & { householdId: string; name: string; gradeLabel: string; username: string; password: string }) => Promise<void>
  onCancel: () => void
}

export function ChildForm({ householdId, child, onSubmit, onCancel }: ChildFormProps) {
  const [formData, setFormData] = useState({
    name: child?.name || '',
    gradeLabel: child?.gradeLabel || '',
    dob: child?.dob || '',
    teacherName: child?.teacherName || '',
    username: child?.username || '',
    password: child?.password || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!formData.name.trim() || !formData.gradeLabel.trim() || !formData.username.trim() || !formData.password.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        householdId,
        name: formData.name.trim(),
        gradeLabel: formData.gradeLabel.trim(),
        dob: formData.dob || undefined,
        teacherName: formData.teacherName?.trim() || undefined,
        username: formData.username.trim(),
        password: formData.password.trim(),
      })
      setFormData({
        name: '',
        gradeLabel: '',
        dob: '',
        teacherName: '',
        username: '',
        password: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-xs font-medium text-slate-600 mb-1.5">
          Child's name *
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g. Adam"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
          maxLength={80}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="gradeLabel" className="block text-xs font-medium text-slate-600 mb-1.5">
            Grade/Level *
          </label>
          <input
            id="gradeLabel"
            type="text"
            value={formData.gradeLabel}
            onChange={(e) => setFormData(prev => ({ ...prev, gradeLabel: e.target.value }))}
            placeholder="e.g. Grade 5"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            maxLength={50}
          />
        </div>
        <div>
          <label htmlFor="dob" className="block text-xs font-medium text-slate-600 mb-1.5">
            Date of birth
          </label>
          <input
            id="dob"
            type="date"
            value={formData.dob}
            onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
          />
        </div>
      </div>

      <div>
        <label htmlFor="teacherName" className="block text-xs font-medium text-slate-600 mb-1.5">
          Teacher/Instructor name
        </label>
        <input
          id="teacherName"
          type="text"
          value={formData.teacherName}
          onChange={(e) => setFormData(prev => ({ ...prev, teacherName: e.target.value }))}
          placeholder="e.g. Mrs. Fatima"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
          maxLength={80}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="username" className="block text-xs font-medium text-slate-600 mb-1.5">
            Username *
          </label>
          <input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            placeholder="e.g. adam.student"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            maxLength={50}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs font-medium text-slate-600 mb-1.5">
            Password *
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="••••••••"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            maxLength={100}
          />
        </div>
      </div>

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
