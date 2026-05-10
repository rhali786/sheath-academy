import { useState } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import { ChartContainer } from './shared/ChartContainer'
import { QuranProgressRing } from './shared/QuranProgressRing'
import { nivoTheme } from '../theme'
import type { Child } from '../types'

interface PerChildProgressProps {
  children: Child[]
  progressData: any
}

export function PerChildProgress({ children, progressData }: PerChildProgressProps) {
  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id)

  const selectedChild = children.find(c => c.id === selectedChildId)
  const childProgress = progressData[selectedChildId as keyof typeof progressData]

  if (!selectedChild || !childProgress) return null

  const subjects = Array.isArray(childProgress.subjects) ? childProgress.subjects : []
  const chartData = subjects.map((s: any) => ({ subject: s.subject, completion: s.completion }))

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">

      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Per-Child Progress</h2>

        {/* Child selector — pill buttons */}
        <div className="flex gap-2 flex-wrap">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedChildId === child.id
                  ? 'bg-forest-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-forest-200 hover:text-forest-900'
              }`}
            >
              {child.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Subject completion horizontal bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">
            Subject Completion
          </p>
          <ChartContainer height={280}>
            <ResponsiveBar
              data={Array.isArray(chartData) ? chartData : []}
              keys={['completion']}
              indexBy="subject"
              layout="horizontal"
              margin={{ top: 10, right: 50, bottom: 20, left: 110 }}
              colors={['#1a5c3a']}
              theme={nivoTheme}
              axisBottom={null}
              axisLeft={{
                tickSize: 0,
                tickPadding: 12,
                tickRotation: 0,
              }}
              valueFormat=">-.0f"
              label={d => `${d.value}%`}
              labelSkipWidth={20}
              labelSkipHeight={12}
              labelTextColor="#ffffff"
              animate={true}
              enableLabel={true}
              borderRadius={4}
              enableGridY={false}
              enableGridX={true}
            />
          </ChartContainer>
        </div>

        {/* Quran progress card — signature ring motif */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center gap-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest self-start">
            Quran Progress
          </p>

          <QuranProgressRing
            streak={childProgress.streak || 0}
            juzProgress={childProgress.streak || 0}
            size={130}
          />

          <div className="w-full space-y-3">
            <div className="bg-forest-50 rounded-xl p-3.5">
              <p className="text-xs font-semibold text-forest-700 uppercase tracking-wide">Current</p>
              <p className="text-sm font-bold text-forest-900 mt-1">{childProgress.quranCurrent}</p>
            </div>
            <div className="bg-sky-50 rounded-xl p-3.5">
              <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide">Last Logged</p>
              <p className="text-sm font-bold text-sky-800 mt-1">{childProgress.lastLogged}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
