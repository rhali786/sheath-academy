'use client'

import { useState } from 'react'
import { LOGO_PRESET_KEYS, type LogoPresetKey } from '@/features/lib/types'
import { DEFAULT_LOGO_PRESET, LOGO_PRESET_NAMES, LogoMark, isLogoPresetKey } from './logoPresets'

interface HouseholdLogoPickerProps {
  /** The household's currently saved preset key, if any. */
  value?: string | null
  /** Called after a successful PUT with the newly saved preset key, so the parent can refresh its own state. */
  onSaved?: (preset: LogoPresetKey) => void
}

/**
 * A cycling picker for the household's logo preset mark. Clicking "Change mark" advances to
 * the next of the 5 preset keys and persists the selection via PUT /api/household/profile.
 */
export function HouseholdLogoPicker({ value, onSaved }: HouseholdLogoPickerProps) {
  const initial: LogoPresetKey = isLogoPresetKey(value) ? value : DEFAULT_LOGO_PRESET
  const [selected, setSelected] = useState<LogoPresetKey>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  async function handleCycle() {
    if (saving) return
    const currentIndex = LOGO_PRESET_KEYS.indexOf(selected)
    const next = LOGO_PRESET_KEYS[(currentIndex + 1) % LOGO_PRESET_KEYS.length]
    setSaving(true)
    setError(false)
    try {
      const res = await fetch('/api/household/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoPreset: next }),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      setSelected(next)
      onSaved?.(next)
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-forest-700"
      >
        <LogoMark preset={selected} className="w-7 h-7" />
      </div>
      <div>
        <button
          type="button"
          onClick={handleCycle}
          disabled={saving}
          data-testid="household-logo-picker-cycle"
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Change mark'}
        </button>
        <p className="text-xs text-slate-500 mt-1">{LOGO_PRESET_NAMES[selected]}</p>
        {error && <p className="text-xs text-red-600 mt-1">Couldn&apos;t save. Try again.</p>}
      </div>
    </div>
  )
}
