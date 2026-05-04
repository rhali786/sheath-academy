import { useState } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import { ChartContainer } from './shared/ChartContainer'
import type { Child } from '../types'

interface PerChildProgressProps {
  children: Child[]
  progressData: any
}

export function PerChildProgress({ children, progressData }: PerChildProgressProps) {
  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id)

  const selectedChild = children.find(c => c.id === selectedChildId)
  const childProgress = progressData[selectedChildId]

  if (!selectedChild || !childProgress) return null

  const chartData = childProgress.subjects.map((subject: any) => ({
    subject: subject.subject,
    completion: subject.completion,
  }))

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="card-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Per-Child Progress</h2>

          <div className="flex gap-2 flex-wrap">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedChildId === child.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {child.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Completion</h3>
            <ChartContainer height={300}>
              <ResponsiveBar
                data={chartData}
                keys={['completion']}
                indexBy="subject"
                layout="horizontal"
                margin={{ top: 20, right: 20, bottom: 20, left: 100 }}
                colors={['#10b981']}
                axisBottom={undefined}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: '',
                  legendPosition: 'middle',
                  legendOffset: 32,
                }}
                valueFormat=">-.0f"
                label={d => `${d.value}%`}
                labelSkipWidth={12}
                labelSkipHeight={12}
                animate={true}
                enableLabel={true}
              />
            </ChartContainer>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quran Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-600 font-medium uppercase">Current</p>
                  <p className="text-lg font-bold text-blue-900 mt-1">{childProgress.quranCurrent}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-xs text-green-600 font-medium uppercase">Streak</p>
                  <p className="text-lg font-bold text-green-900 mt-1">{childProgress.streak} days</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3">Last logged: {childProgress.lastLogged}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
