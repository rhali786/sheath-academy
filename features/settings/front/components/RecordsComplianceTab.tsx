'use client'

import { useEffect, useState } from 'react'
import { settingsApi } from '@/features/settings/front/services/api'

type TrackingMethod = 'days' | 'hours'
type ExportFormat = 'pdf' | 'csv'

const DEFAULT_TRACKING_METHOD: TrackingMethod = 'days'
const DEFAULT_EXPORT_FORMAT: ExportFormat = 'pdf'

export function RecordsComplianceTab() {
  const [trackingMethod, setTrackingMethod] = useState<TrackingMethod>(DEFAULT_TRACKING_METHOD)
  const [exportFormat, setExportFormat] = useState<ExportFormat>(DEFAULT_EXPORT_FORMAT)
  const [savedTrackingMethod, setSavedTrackingMethod] = useState<TrackingMethod>(DEFAULT_TRACKING_METHOD)
  const [savedExportFormat, setSavedExportFormat] = useState<ExportFormat>(DEFAULT_EXPORT_FORMAT)
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
        const loadedTracking = typeof data['records.trackingMethod'] === 'string'
          ? (data['records.trackingMethod'] as TrackingMethod)
          : DEFAULT_TRACKING_METHOD
        const loadedExport = typeof data['records.exportFormat'] === 'string'
          ? (data['records.exportFormat'] as ExportFormat)
          : DEFAULT_EXPORT_FORMAT
        setTrackingMethod(loadedTracking)
        setExportFormat(loadedExport)
        setSavedTrackingMethod(loadedTracking)
        setSavedExportFormat(loadedExport)
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

  const dirty = trackingMethod !== savedTrackingMethod || exportFormat !== savedExportFormat

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await settingsApi.updateSettings({
        'records.trackingMethod': trackingMethod,
        'records.exportFormat': exportFormat,
      })
      setSavedTrackingMethod(trackingMethod)
      setSavedExportFormat(exportFormat)
      setSaved(true)
    } catch {
      setError('Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section data-testid="settings-panel-records-compliance">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Records & Compliance</h2>
      <p className="text-sm text-slate-500 mb-6">
        Configure attendance tracking and record export preferences.
      </p>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md space-y-4">
          <div>
            <label htmlFor="tracking-method" className="block text-xs font-medium text-slate-600 mb-1.5">
              Attendance tracking method
            </label>
            <select
              id="tracking-method"
              value={trackingMethod}
              disabled={loading}
              onChange={(e) => {
                setTrackingMethod(e.target.value as TrackingMethod)
                setSaved(false)
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              <option value="days">Track by school day</option>
              <option value="hours">Track by instructional hours</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Determines how attendance records are tallied for reports.
            </p>
          </div>

          <div>
            <label htmlFor="export-format" className="block text-xs font-medium text-slate-600 mb-1.5">
              Default export format
            </label>
            <select
              id="export-format"
              value={exportFormat}
              disabled={loading}
              onChange={(e) => {
                setExportFormat(e.target.value as ExportFormat)
                setSaved(false)
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          {error && <p className="text-red-500 text-xs" data-testid="records-compliance-error">{error}</p>}
          {saved && !dirty && (
            <p className="text-green-600 text-xs" data-testid="records-compliance-success">
              Saved.
            </p>
          )}

          <button
            type="button"
            data-testid="records-compliance-save"
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
