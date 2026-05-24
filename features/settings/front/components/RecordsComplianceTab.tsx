'use client'

import { useState } from 'react'

export function RecordsComplianceTab() {
  const [trackingMethod, setTrackingMethod] = useState<'days' | 'hours'>('days')
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf')

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
              onChange={(e) => setTrackingMethod(e.target.value as typeof trackingMethod)}
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
              onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  )
}
