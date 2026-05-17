'use client'

import { useState, useEffect, useCallback } from 'react'
import type { HouseholdProfile, DayOfWeek, DayLoadPreference, DateDisplayPreference } from '@/features/lib/types'
import { householdApi } from '../services/api'
import { useHousehold } from '../context'

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_LOADS: DayLoadPreference[] = ['Off', 'Light', 'Normal', 'Heavy']
const DATE_DISPLAY_OPTIONS: { value: DateDisplayPreference; label: string }[] = [
  { value: 'gregorian', label: 'Gregorian only' },
  { value: 'gregorian-hijri-en', label: 'Gregorian + English Hijri' },
  { value: 'bilingual', label: 'Full bilingual (Arabic + English Hijri)' },
]
const COMMON_TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'Europe/London', 'Europe/Paris',
  'Asia/Dubai', 'Asia/Riyadh', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka',
  'Africa/Cairo', 'Australia/Sydney', 'Pacific/Auckland',
]

function profileToForm(p: HouseholdProfile | null) {
  return {
    weekStartDay: (p?.weekStartDay ?? 'Monday') as DayOfWeek,
    schoolDays: p?.schoolDays ?? (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as DayOfWeek[]),
    dayLoad: p?.dayLoad ?? ({} as Partial<Record<DayOfWeek, DayLoadPreference>>),
    reportingName: p?.reportingName ?? '',
    timezone: p?.timezone ?? '',
    dateDisplay: (p?.dateDisplay ?? 'gregorian') as DateDisplayPreference,
    jumuahLeaveWindow: p?.jumuahLeaveWindow ?? '',
    jumuahReturnWindow: p?.jumuahReturnWindow ?? '',
  }
}

export function HouseholdSettings() {
  const { householdProfile } = useHousehold()
  const [form, setForm] = useState(() => profileToForm(householdProfile))
  const [saved, setSaved] = useState(() => profileToForm(householdProfile))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (householdProfile) {
      const initial = profileToForm(householdProfile)
      setForm(initial)
      setSaved(initial)
    } else {
      householdApi.getProfile().then(res => {
        if (res.data) {
          const initial = profileToForm(res.data)
          setForm(initial)
          setSaved(initial)
        }
      }).catch(() => {})
    }
  }, [householdProfile])

  const hasUnsavedChanges = JSON.stringify(form) !== JSON.stringify(saved)

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  const toggleSchoolDay = useCallback((day: DayOfWeek) => {
    setForm(f => ({
      ...f,
      schoolDays: f.schoolDays.includes(day)
        ? f.schoolDays.filter(d => d !== day)
        : [...f.schoolDays, day],
    }))
  }, [])

  const setDayLoad = useCallback((day: DayOfWeek, load: DayLoadPreference) => {
    setForm(f => ({ ...f, dayLoad: { ...f.dayLoad, [day]: load } }))
  }, [])

  async function handleSave() {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await householdApi.updateProfile({
        weekStartDay: form.weekStartDay,
        schoolDays: form.schoolDays,
        dayLoad: form.dayLoad,
        reportingName: form.reportingName || undefined,
        timezone: form.timezone || undefined,
        dateDisplay: form.dateDisplay,
        jumuahLeaveWindow: form.jumuahLeaveWindow || undefined,
        jumuahReturnWindow: form.jumuahReturnWindow || undefined,
      })
      setSaved(form)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {hasUnsavedChanges && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800" role="alert" aria-live="polite">
          You have unsaved changes. Save before navigating away.
        </div>
      )}

      {/* Household Identity */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Household identity</h3>
        <p className="text-xs text-slate-500 mb-3">Optional name used in printed records and reports.</p>
        <div className="bg-white rounded-xl border border-slate-200 p-4 max-w-md">
          <label htmlFor="reporting-name" className="block text-xs font-medium text-slate-600 mb-1.5">
            School / reporting name
          </label>
          <input
            id="reporting-name"
            type="text"
            value={form.reportingName}
            onChange={e => setForm(f => ({ ...f, reportingName: e.target.value }))}
            placeholder="e.g. Al-Noor Home Academy"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            maxLength={120}
          />
        </div>
      </section>

      {/* Weekly Rhythm */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Weekly rhythm</h3>
        <p className="text-xs text-slate-500 mb-3">Set your school week structure and workload balance.</p>
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-5">
          <div>
            <label htmlFor="week-start-day" className="block text-xs font-medium text-slate-600 mb-1.5">
              Week starts on
            </label>
            <select
              id="week-start-day"
              value={form.weekStartDay}
              onChange={e => setForm(f => ({ ...f, weekStartDay: e.target.value as DayOfWeek }))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              {DAYS_OF_WEEK.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">Default school days</p>
            <div className="flex flex-wrap gap-3">
              {DAYS_OF_WEEK.map(day => (
                <label key={day} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.schoolDays.includes(day)}
                    onChange={() => toggleSchoolDay(day)}
                    className="w-4 h-4 text-forest-900 border-slate-300 rounded focus:ring-forest-900"
                    aria-label={day}
                  />
                  <span className="text-xs text-slate-700">{day.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">Day-load preference</p>
            <div className="space-y-1.5">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-24">{day}</span>
                  <select
                    value={form.dayLoad[day] ?? 'Normal'}
                    onChange={e => setDayLoad(day, e.target.value as DayLoadPreference)}
                    aria-label={`${day} load`}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-forest-900"
                  >
                    {DAY_LOADS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Protected Time */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Protected time</h3>
        <p className="text-xs text-slate-500 mb-3">Optional Jumu&apos;ah time windows (Friday prayer leave and return).</p>
        <div className="bg-white rounded-xl border border-slate-200 p-4 max-w-md space-y-3">
          <div className="flex gap-4">
            <div>
              <label htmlFor="jumuah-leave" className="block text-xs font-medium text-slate-600 mb-1">
                Leave for Jumu&apos;ah
              </label>
              <input
                id="jumuah-leave"
                type="time"
                value={form.jumuahLeaveWindow}
                onChange={e => setForm(f => ({ ...f, jumuahLeaveWindow: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
              />
            </div>
            <div>
              <label htmlFor="jumuah-return" className="block text-xs font-medium text-slate-600 mb-1">
                Return from Jumu&apos;ah
              </label>
              <input
                id="jumuah-return"
                type="time"
                value={form.jumuahReturnWindow}
                onChange={e => setForm(f => ({ ...f, jumuahReturnWindow: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Calendar & Time */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Calendar &amp; time</h3>
        <p className="text-xs text-slate-500 mb-3">Date display format and timezone for your household.</p>
        <div className="bg-white rounded-xl border border-slate-200 p-4 max-w-md space-y-4">
          <div>
            <label htmlFor="date-display" className="block text-xs font-medium text-slate-600 mb-1.5">
              Date display
            </label>
            <select
              id="date-display"
              value={form.dateDisplay}
              onChange={e => setForm(f => ({ ...f, dateDisplay: e.target.value as DateDisplayPreference }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              {DATE_DISPLAY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="timezone" className="block text-xs font-medium text-slate-600 mb-1.5">
              Timezone
            </label>
            <select
              id="timezone"
              value={form.timezone}
              onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              <option value="">— Select timezone —</option>
              {COMMON_TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !hasUnsavedChanges}
          className="px-5 py-2.5 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving…' : 'Save settings'}
        </button>
        {success && <p className="text-sm text-green-700">Settings saved.</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
