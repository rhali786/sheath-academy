import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, TrendingUp, Folder, BookOpen } from 'lucide-react'
import { childScopedHref } from '@/features/lib/front/navigation'
import type { DashboardRecord } from '../types'

interface RecordsProofProps {
  records: DashboardRecord[]
  selectedChildId?: string | null
}

const iconMap: Record<string, React.ReactNode> = {
  CheckCircle: <CheckCircle className="w-5 h-5 text-forest-900" />,
  TrendingUp:  <TrendingUp  className="w-5 h-5 text-sky-600" />,
  Folder:      <Folder      className="w-5 h-5 text-violet-600" />,
  BookOpen:    <BookOpen    className="w-5 h-5 text-amber-600" />,
}

const RECORD_BASE_ROUTES: Record<string, string> = {
  record_attendance: '/attendance',
  record_progress: '/lessons',
  record_portfolio: '/portfolio',
  record_quran: '/quran',
}

const exportButtons = [
  { key: 'attendance', label: 'Attendance Report', style: 'bg-forest-50 text-forest-900 hover:bg-forest-100 border-forest-200' },
  { key: 'progress',   label: 'Progress Report',   style: 'bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200' },
  { key: 'portfolio',  label: 'Portfolio Export',  style: 'bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200' },
  { key: 'quran',      label: 'Quran Summary',     style: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' },
  { key: 'islamic',    label: 'Islamic Studies',   style: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200' },
]

export function RecordsProof({ records, selectedChildId }: RecordsProofProps) {
  const [selectedExport, setSelectedExport] = useState<string | null>(null)

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8 pb-16">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Records Readiness</h2>
      <p className="text-xs text-slate-400 mb-6" data-testid="records-readiness-indicator">
        Proof of learning across all subjects and activities.
      </p>

      {/* Record cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {records.map((record) => (
          <div key={record.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center mb-4">
              {iconMap[record.icon] || <span className="text-lg">📊</span>}
            </div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{record.title}</h3>
            <p className="text-3xl font-bold text-forest-900 tabular-nums leading-none">
              {record.count}
              {record.maxCount ? (
                <span className="text-lg font-medium text-slate-300">/{record.maxCount}</span>
              ) : null}
            </p>
            {RECORD_BASE_ROUTES[record.id] ? (
              <Link href={childScopedHref(RECORD_BASE_ROUTES[record.id], selectedChildId)} className="mt-3 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors">
                {record.viewButton} →
              </Link>
            ) : (
              <span className="mt-3 text-xs font-semibold text-slate-400">{record.viewButton} →</span>
            )}
          </div>
        ))}
      </div>

      {/* Export row */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Ready to Export</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {exportButtons.map(({ key, label, style }) => (
            <button
              key={key}
              onClick={() => setSelectedExport(key)}
              className={`px-4 py-3 rounded-xl font-medium text-xs border transition-colors ${style}`}
            >
              {label} ↗
            </button>
          ))}
        </div>
      </div>

      {/* Export confirmation */}
      {selectedExport && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">Print Report</h3>
            <p className="text-sm text-slate-500 mb-6">
              Ready to print your {selectedExport} report. Use your browser&apos;s print dialog to save as PDF or send to a printer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { window.print(); setSelectedExport(null) }}
                className="flex-1 px-4 py-2.5 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800 transition-colors"
              >
                Print report
              </button>
              <button
                onClick={() => setSelectedExport(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
