'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, TrendingUp, Folder, BookOpen } from 'lucide-react'
import { childScopedHref } from '@/features/lib/front/navigation'
import { useHousehold } from '@/features/household/front/context'
import type { QuranSession } from '@/features/lib/types'
import type { DashboardRecord } from '../types'
import type { RecordsReport } from '@/features/records/types'
import { reportsApi } from '@/features/records/front/services/api'
import {
  RecordsPrintReport,
  type RecordsPrintVariant,
} from '@/features/records/front/components/RecordsPrintReport'
import { printDashboardReport } from '@/features/records/front/lib/printDashboardReport'
import { quranApi } from '@/features/quran/front/services/api'

interface RecordsProofProps {
  records: DashboardRecord[]
  selectedChildId?: string | null
}

const iconMap: Record<string, React.ReactNode> = {
  CheckCircle: <CheckCircle className="w-5 h-5 text-forest-900" />,
  TrendingUp: <TrendingUp className="w-5 h-5 text-sky-600" />,
  Folder: <Folder className="w-5 h-5 text-violet-600" />,
  BookOpen: <BookOpen className="w-5 h-5 text-amber-600" />,
}

const RECORD_BASE_ROUTES: Record<string, string> = {
  record_attendance: '/attendance',
  record_progress: '/lessons',
  record_portfolio: '/portfolio',
  record_quran: '/quran',
}

const exportButtons: { key: RecordsPrintVariant; label: string; style: string }[] = [
  { key: 'attendance', label: 'Attendance Report', style: 'bg-forest-50 text-forest-900 hover:bg-forest-100 border-forest-200' },
  { key: 'progress', label: 'Progress Report', style: 'bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200' },
  { key: 'portfolio', label: 'Portfolio Export', style: 'bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200' },
  { key: 'quran', label: 'Quran Summary', style: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' },
  { key: 'islamic', label: 'Islamic Studies', style: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200' },
]

export function RecordsProof({ records, selectedChildId }: RecordsProofProps) {
  const { studentProfiles } = useHousehold()
  const activeChildren = useMemo(
    () => studentProfiles.filter((c) => c.isActive !== false),
    [studentProfiles],
  )

  const [selectedExport, setSelectedExport] = useState<RecordsPrintVariant | null>(null)
  const [exportChildId, setExportChildId] = useState('')
  const [report, setReport] = useState<RecordsReport | null>(null)
  const [quranSessions, setQuranSessions] = useState<QuranSession[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedExport) return
    const defaultChild =
      (selectedChildId && activeChildren.some((c) => c.id === selectedChildId)
        ? selectedChildId
        : activeChildren[0]?.id) ?? ''
    setExportChildId(defaultChild)
  }, [selectedExport, selectedChildId, activeChildren])

  useEffect(() => {
    if (!selectedExport || !exportChildId) {
      setReport(null)
      setQuranSessions([])
      return
    }

    let active = true
    setLoading(true)
    setLoadError(null)

    const needsQuran = selectedExport === 'quran' || selectedExport === 'full'

    Promise.all([
      reportsApi.getRecordsReport({ childId: exportChildId }),
      needsQuran ? quranApi.getSessions(exportChildId) : Promise.resolve(null),
    ])
      .then(([reportRes, quranRes]) => {
        if (!active) return
        setReport(reportRes.data)
        setQuranSessions(quranRes?.data.sessions ?? [])
      })
      .catch((err: Error) => {
        if (!active) return
        setLoadError(err.message ?? 'Failed to load report')
        setReport(null)
        setQuranSessions([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [selectedExport, exportChildId])

  function closeExport() {
    setSelectedExport(null)
    setReport(null)
    setQuranSessions([])
    setLoadError(null)
  }

  function handlePrint() {
    printDashboardReport(() => closeExport())
  }

  const exportLabel = exportButtons.find((b) => b.key === selectedExport)?.label ?? 'report'

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8 pb-16">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Records Readiness</h2>
      <p className="text-xs text-slate-400 mb-6" data-testid="records-readiness-indicator">
        This week&apos;s proof of learning across all subjects and activities.
      </p>

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
              <Link
                href={childScopedHref(RECORD_BASE_ROUTES[record.id], selectedChildId)}
                className="mt-3 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
              >
                {record.viewButton} →
              </Link>
            ) : (
              <span className="mt-3 text-xs font-semibold text-slate-400">{record.viewButton} →</span>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Ready to Export</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {exportButtons.map(({ key, label, style }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedExport(key)}
              className={`px-4 py-3 rounded-xl font-medium text-xs border transition-colors ${style}`}
            >
              {label} ↗
            </button>
          ))}
        </div>
      </div>

      {report && selectedExport && (
        <div className="dashboard-print-report fixed -left-[9999px] top-0 w-full" aria-hidden="true">
          <RecordsPrintReport
            report={report}
            variant={selectedExport}
            quranSessions={quranSessions}
          />
        </div>
      )}

      {selectedExport && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-2">Print {exportLabel}</h3>

            {activeChildren.length === 0 ? (
              <p className="text-sm text-slate-500 mb-6">Add a learner before printing records.</p>
            ) : (
              <>
                <label htmlFor="export-child" className="block text-xs font-semibold text-slate-500 mb-1">
                  Learner
                </label>
                <select
                  id="export-child"
                  value={exportChildId}
                  onChange={(e) => setExportChildId(e.target.value)}
                  className="mb-4 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {activeChildren.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              </>
            )}

            {loading && <p className="text-sm text-slate-500 mb-4">Loading report…</p>}
            {loadError && (
              <p className="text-sm text-red-600 mb-4" role="alert">
                {loadError}
              </p>
            )}

            {report && !loading && (
              <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                <RecordsPrintReport
                  report={report}
                  variant={selectedExport}
                  quranSessions={quranSessions}
                  className="!shadow-none !px-0 !py-0 text-sm"
                />
              </div>
            )}

            <p className="text-sm text-slate-500 mb-6">
              Use your browser&apos;s print dialog to save as PDF or send to a printer — same as Print records on the
              Records page.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrint}
                disabled={!report || loading || activeChildren.length === 0}
                className="flex-1 px-4 py-2.5 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800 transition-colors disabled:opacity-50"
              >
                Print report
              </button>
              <button
                type="button"
                onClick={closeExport}
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
