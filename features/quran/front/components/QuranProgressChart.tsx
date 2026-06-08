'use client'

import { useMemo } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { BookOpen } from 'lucide-react'
import { ChartContainer } from './shared/ChartContainer'
import { nivoTheme, FOREST_LINE, FOREST_FILL_FROM, FOREST_FILL_TO } from '../theme'
import type { QuranSession } from '@/features/lib/types'

export interface WeekBucket {
  weekStart: string
  count: number
}

/** Groups sessions into weekly buckets keyed by the Sunday that starts each week. */
export function bucketByWeek(sessions: QuranSession[]): WeekBucket[] {
  if (sessions.length === 0) return []

  const counts = new Map<string, number>()
  for (const session of sessions) {
    const [year, month, day] = session.date.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    date.setDate(date.getDate() - date.getDay())
    const weekStart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    counts.set(weekStart, (counts.get(weekStart) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([weekStart, count]) => ({ weekStart, count }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
}

function formatWeekLabel(weekStart: string): string {
  const [year, month, day] = weekStart.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface QuranProgressChartProps {
  sessions: QuranSession[]
  loading: boolean
}

export function QuranProgressChart({ sessions, loading }: QuranProgressChartProps) {
  const { data, isEmpty } = useMemo(() => {
    const buckets = bucketByWeek(sessions)
    return {
      data: [
        {
          id: 'sessions',
          data: buckets.map(b => ({ x: formatWeekLabel(b.weekStart), y: b.count })),
        },
      ],
      isEmpty: buckets.length === 0,
    }
  }, [sessions])

  return (
    <section className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="form-section-heading">Memorization progress</h2>

      {loading ? (
        <div data-testid="quran-progress-chart-loading" className="h-[240px] animate-pulse">
          <div className="h-full w-full rounded-lg bg-slate-100 flex items-end gap-3 p-4">
            {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-slate-200" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      ) : isEmpty ? (
        <div data-testid="quran-progress-chart-empty" className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 text-forest-700">
            <BookOpen className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-slate-700">No Quran sessions logged yet</p>
          <p className="mt-1 text-sm text-slate-500">Log a session to start tracking weekly memorization progress</p>
        </div>
      ) : (
        <div data-testid="quran-progress-chart-populated">
          <ChartContainer height={240}>
            <ResponsiveLine
              data={data}
              theme={nivoTheme}
              margin={{ top: 16, right: 24, bottom: 40, left: 40 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false }}
              curve="monotoneX"
              colors={[FOREST_LINE]}
              lineWidth={2.5}
              enablePoints={true}
              pointSize={6}
              pointColor="#ffffff"
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              enableArea={true}
              areaOpacity={1}
              enableGridX={false}
              enableGridY={true}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 0,
                tickPadding: 8,
                format: (v: string) => v,
              }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 6,
                format: (v: number) => Number.isInteger(v) ? String(v) : '',
              }}
              legends={[]}
              markers={[]}
              layers={['grid', 'markers', 'axes', 'areas', 'crosshair', 'lines', 'points', 'slices', 'mesh', 'legends']}
              defs={[
                {
                  id: 'quranProgressGradient',
                  type: 'linearGradient',
                  colors: [
                    { offset: 0, color: FOREST_FILL_FROM },
                    { offset: 100, color: FOREST_FILL_TO },
                  ],
                },
              ]}
              fill={[{ match: '*', id: 'quranProgressGradient' }]}
              tooltip={({ point }: any) => (
                <div className="bg-white rounded-lg shadow-lg px-3 py-2 text-xs border border-slate-100">
                  <span className="font-semibold text-slate-700">{point.data.xFormatted}</span>
                  <span className="text-slate-500 ml-1.5">· {point.data.yFormatted} session{point.data.y === 1 ? '' : 's'}</span>
                </div>
              )}
            />
          </ChartContainer>
        </div>
      )}
    </section>
  )
}
