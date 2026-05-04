import { useState } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { ChartContainer } from './shared/ChartContainer'
import { X } from 'lucide-react'
import type { QuranSession, Child, NivoLineSeries } from '../types'

interface QuranStudiesProps {
  children: Child[]
  quranSessions: QuranSession[]
  onAddSession: (session: any) => void
  chartData?: NivoLineSeries[]
}

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

  const defaultChartData: NivoLineSeries[] = [
    {
      id: 'Adam',
      color: '#3b82f6',
      data: [
        { x: 'Mon', y: 1 },
        { x: 'Tue', y: 1 },
        { x: 'Wed', y: 0 },
        { x: 'Thu', y: 1 },
        { x: 'Fri', y: 0 },
      ]
    },
    {
      id: 'Khadijah',
      color: '#10b981',
      data: [
        { x: 'Mon', y: 1 },
        { x: 'Tue', y: 0 },
        { x: 'Wed', y: 1 },
        { x: 'Thu', y: 1 },
        { x: 'Fri', y: 0 },
      ]
    },
    {
      id: 'Zayd',
      color: '#f59e0b',
      data: [
        { x: 'Mon', y: 0 },
        { x: 'Tue', y: 1 },
        { x: 'Wed', y: 1 },
        { x: 'Thu', y: 0 },
        { x: 'Fri', y: 0 },
      ]
    },
  ]

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
    <section className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="card-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quran, Arabic & Islamic Studies</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column: Quran Logging */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quran Logging</h3>
            <div className="space-y-4">
              {children.map((child) => {
                const childSession = quranSessions.find(s => s.childId === child.id)
                return (
                  <div key={child.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="font-bold text-gray-900">{child.name}</p>
                    {childSession && (
                      <>
                        <p className="text-sm text-gray-600 mt-1">{childSession.surah} {childSession.fromAyah}–{childSession.toAyah}</p>
                        <p className="text-xs text-gray-500 mt-1">Type: {childSession.type}</p>
                        <p className="text-xs text-gray-500">Last: {childSession.lastLogged}</p>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setFormData({ ...formData, childId: child.id })
                        setIsModalOpen(true)
                      }}
                      className="mt-3 w-full px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-100 transition"
                    >
                      Log Session
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Middle Column: Chart */}
          <div className="lg:col-span-2">
            <ChartContainer height={350} title="Weekly Sessions">
              <ResponsiveLine
                data={chartData || defaultChartData}
                margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 0, max: 2 }}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Day',
                  legendOffset: 36,
                  legendPosition: 'middle',
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Sessions',
                  legendOffset: -40,
                  legendPosition: 'middle',
                }}
                colors={{ datum: 'color' }}
                enableArea={true}
                pointSize={6}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor', modifiers: [['darker', 0.3]] }}
                tooltip={({ point }: any) => (
                  <div className="bg-white rounded-lg shadow-lg p-2 text-xs">
                    <strong>{point.serieId}:</strong> {point.data.y} sessions
                  </div>
                )}
              />
            </ChartContainer>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Log Quran Session</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                  <select
                    value={formData.childId}
                    onChange={(e) => setFormData({ ...formData, childId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>{child.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option>New memorization</option>
                    <option>Revision</option>
                    <option>Recitation practice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Surah</label>
                  <input
                    type="text"
                    value={formData.surah}
                    onChange={(e) => setFormData({ ...formData, surah: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Ayah</label>
                    <input
                      type="number"
                      value={formData.fromAyah}
                      onChange={(e) => setFormData({ ...formData, fromAyah: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Ayah</label>
                    <input
                      type="number"
                      value={formData.toAyah}
                      onChange={(e) => setFormData({ ...formData, toAyah: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
