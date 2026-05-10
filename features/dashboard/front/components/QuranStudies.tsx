import { useState } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import { ChartContainer } from './shared/ChartContainer'
import { X } from 'lucide-react'
import { nivoTheme, childColors } from '../theme'
import type { QuranSession, Child, NivoLineSeries } from '../types'

interface QuranStudiesProps {
  children: Child[]
  quranSessions: QuranSession[]
  onAddSession: (session: any) => void
  chartData?: NivoLineSeries[]
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

function buildBarData(lineData: NivoLineSeries[]) {
  return WEEK_DAYS.map(day => {
    const row: Record<string, any> = { day }
    lineData.forEach(series => {
      const point = series.data.find(d => d.x === day)
      row[series.id as string] = point ? point.y : 0
    })
    return row
  })
}

const defaultChartData: NivoLineSeries[] = [
  {
    id: 'Adam',
    color: childColors[0],
    data: [{ x: 'Mon', y: 1 }, { x: 'Tue', y: 1 }, { x: 'Wed', y: 0 }, { x: 'Thu', y: 1 }, { x: 'Fri', y: 0 }],
  },
  {
    id: 'Khadijah',
    color: childColors[1],
    data: [{ x: 'Mon', y: 1 }, { x: 'Tue', y: 0 }, { x: 'Wed', y: 1 }, { x: 'Thu', y: 1 }, { x: 'Fri', y: 0 }],
  },
  {
    id: 'Zayd',
    color: childColors[2],
    data: [{ x: 'Mon', y: 0 }, { x: 'Tue', y: 1 }, { x: 'Wed', y: 1 }, { x: 'Thu', y: 0 }, { x: 'Fri', y: 0 }],
  },
]

export function QuranStudies({ children, quranSessions, onAddSession, chartData }: QuranStudiesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    childId: children[0]?.id,
    type: 'New memorization',
    surah: 'Al-Mulk',
    fromAyah: 1,
    toAyah: 5,
    notes: '',
  })

  const rawData = Array.isArray(chartData) ? chartData : defaultChartData
  const barData = buildBarData(rawData)
  const childKeys = rawData.map(s => s.id as string)
  const barColors = rawData.map((_, i) => childColors[i] || childColors[0])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onAddSession(formData)
    setIsModalOpen(false)
    setFormData({
      childId: children[0]?.id,
      type: 'New memorization',
      surah: 'Al-Mulk',
      fromAyah: 1,
      toAyah: 5,
      notes: '',
    })
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Quran, Arabic & Islamic Studies</h2>
        <p className="text-sm text-slate-400 mt-1">Weekly session tracking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Per-child logging cards */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
            Quran Logging
          </p>
          {children.map((child, i) => {
            const session = quranSessions.find(s => s.childId === child.id)
            const dotColor = childColors[i] || childColors[0]
            return (
              <div key={child.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: dotColor }}
                  />
                  <p className="font-semibold text-slate-900 text-sm">{child.name}</p>
                </div>
                {session ? (
                  <div className="space-y-0.5 mb-3">
                    <p className="text-sm font-medium text-slate-700">
                      {session.surah} {session.fromAyah}–{session.toAyah}
                    </p>
                    <p className="text-xs text-slate-400">{session.type} · Last: {session.lastLogged}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 mb-3">No session logged</p>
                )}
                <button
                  onClick={() => {
                    setFormData(f => ({ ...f, childId: child.id }))
                    setIsModalOpen(true)
                  }}
                  className="w-full py-2 text-xs font-semibold rounded-lg border border-forest-200 text-forest-900 hover:bg-forest-50 transition-colors"
                >
                  Log Session
                </button>
              </div>
            )
          })}
        </div>

        {/* Grouped horizontal bar chart — one cluster per day, one bar per child */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Weekly Sessions
          </p>

          {/* Legend */}
          <div className="flex gap-5 mb-4 flex-wrap">
            {childKeys.map((key, i) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: barColors[i] }} />
                <span className="text-xs text-slate-500 font-medium">{key}</span>
              </div>
            ))}
          </div>

          <ChartContainer height={280}>
            <ResponsiveBar
              data={barData}
              keys={childKeys}
              indexBy="day"
              layout="horizontal"
              groupMode="grouped"
              margin={{ top: 10, right: 20, bottom: 20, left: 50 }}
              colors={barColors}
              theme={nivoTheme}
              maxValue={2}
              axisLeft={{
                tickSize: 0,
                tickPadding: 10,
              }}
              axisBottom={{
                tickSize: 0,
                tickPadding: 8,
                tickValues: [0, 1, 2],
                format: (v: number) => Number.isInteger(v) ? String(v) : '',
              }}
              enableLabel={false}
              enableGridX={true}
              enableGridY={false}
              borderRadius={3}
              padding={0.35}
              innerPadding={3}
              legends={[]}
              tooltip={({ id, value, color: c }) => (
                <div className="bg-white rounded-lg shadow-lg px-3 py-2 text-xs border border-slate-100">
                  <span className="font-semibold" style={{ color: c }}>{id as string}</span>
                  <span className="text-slate-500 ml-1.5">
                    — {value} session{value !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            />
          </ChartContainer>
        </div>
      </div>

      {/* Log session modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-900">Log Quran Session</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="student" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Student
                </label>
                <select
                  id="student"
                  name="childId"
                  value={formData.childId}
                  onChange={(e) => setFormData(f => ({ ...f, childId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-900"
                  required
                >
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="type" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={(e) => setFormData(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-900"
                  required
                >
                  <option>New memorization</option>
                  <option>Revision</option>
                  <option>Recitation practice</option>
                </select>
              </div>

              <div>
                <label htmlFor="surah" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Surah
                </label>
                <input
                  id="surah"
                  type="text"
                  name="surah"
                  value={formData.surah}
                  onChange={(e) => setFormData(f => ({ ...f, surah: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-900"
                  required
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fromAyah" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    From Ayah
                  </label>
                  <input
                    id="fromAyah"
                    type="number"
                    name="fromAyah"
                    value={formData.fromAyah}
                    onChange={(e) => setFormData(f => ({ ...f, fromAyah: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-900"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label htmlFor="toAyah" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    To Ayah
                  </label>
                  <input
                    id="toAyah"
                    type="number"
                    name="toAyah"
                    value={formData.toAyah}
                    onChange={(e) => setFormData(f => ({ ...f, toAyah: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-900"
                    required
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-900 resize-none"
                  rows={3}
                  autoComplete="off"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800 transition-colors"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
