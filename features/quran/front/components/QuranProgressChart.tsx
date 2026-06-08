'use client'

import { useMemo } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { BookOpen } from 'lucide-react'
import { ChartContainer } from './shared/ChartContainer'
import { ChartLegend } from './shared/ChartLegend'
import { nivoTheme, childColors } from '../theme'
import type { QuranSession, StudentProfile } from '@/features/lib/types'

export interface WeekBucket {
  weekStart: string
  count: number
}

/** Sunday that starts the week containing `date` (YYYY-MM-DD), as YYYY-MM-DD. */
function weekStartOf(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  d.setDate(d.getDate() - d.getDay())
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Groups sessions into weekly buckets keyed by the Sunday that starts each week. */
export function bucketByWeek(sessions: QuranSession[]): WeekBucket[] {
  if (sessions.length === 0) return []

  const counts = new Map<string, number>()
  for (const session of sessions) {
    const weekStart = weekStartOf(session.date)
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

export interface ChildSeries {
  id: string
  childId: string
  color: string
  total: number
  data: { x: string; y: number }[]
}

/**
 * Builds one Nivo line series per student that has sessions. All series share the
 * same set of week labels (0-filled for weeks a child had no session) so the slice
 * tooltip can group every learner under a single hovered week. Color is assigned by
 * the student's index in the household list, so a child keeps the same color
 * regardless of the active filter.
 */
export function bucketByWeekPerChild(
  sessions: QuranSession[],
  students: Pick<StudentProfile, 'id' | 'name'>[],
): ChildSeries[] {
  if (sessions.length === 0) return []

  const weeks = Array.from(new Set(sessions.map(s => weekStartOf(s.date)))).sort((a, b) => a.localeCompare(b))

  const series: ChildSeries[] = []
  students.forEach((student, index) => {
    const childSessions = sessions.filter(s => s.childId === student.id)
    if (childSessions.length === 0) return

    const counts = new Map<string, number>()
    for (const s of childSessions) {
      const week = weekStartOf(s.date)
      counts.set(week, (counts.get(week) ?? 0) + 1)
    }

    series.push({
      id: student.name,
      childId: student.id,
      color: childColors[index] || childColors[childColors.length - 1],
      total: childSessions.length,
      data: weeks.map(week => ({ x: formatWeekLabel(week), y: counts.get(week) ?? 0 })),
    })
  })

  return series
}

interface QuranProgressChartProps {
  sessions: QuranSession[]
  students: StudentProfile[]
  loading: boolean
}

export function QuranProgressChart({ sessions, students, loading }: QuranProgressChartProps) {
  const { series, isEmpty } = useMemo(() => {
    const s = bucketByWeekPerChild(sessions, students)
    return { series: s, isEmpty: s.length === 0 }
  }, [sessions, students])

  const totalSessions = sessions.length
  const single = series.length === 1

  // Each series carries its own color; pass them as an explicit ordered array.
  const colors = series.map(s => s.color)

  // Area gradient only for a single series (overlapping fills look muddy). Keep
  // defs/fill as explicit arrays either way — Nivo defaultProps are unreliable in
  // this build and an undefined here previously crashed production.
  const defs = single
    ? [
        {
          id: 'quranAreaGradient',
          type: 'linearGradient',
          colors: [
            { offset: 0, color: series[0].color, opacity: 0.25 },
            { offset: 100, color: series[0].color, opacity: 0 },
          ],
        },
      ]
    : []
  const fill = single ? [{ match: '*' as const, id: 'quranAreaGradient' }] : []

  // Thin the x-axis labels so a half-year of weeks stays readable.
  const weekLabels = series[0]?.data.map(d => d.x) ?? []
  const tickStep = Math.max(1, Math.ceil(weekLabels.length / 8))
  const tickValues = weekLabels.filter((_, i) => i % tickStep === 0)

  return (
    <section className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="form-section-heading mb-0">Memorization progress</h2>
        {!loading && !isEmpty && (
          <span data-testid="quran-progress-chart-summary" className="whitespace-nowrap text-xs font-medium text-slate-500">
            {totalSessions} session{totalSessions === 1 ? '' : 's'} · {series.length} learner{series.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {loading ? (
        <div data-testid="quran-progress-chart-loading" className="h-[280px] animate-pulse">
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
          <ChartContainer height={280}>
            <ResponsiveLine
              data={series.map(s => ({ id: s.id, color: s.color, data: s.data }))}
              theme={nivoTheme}
              margin={{ top: 16, right: 24, bottom: 40, left: 40 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false }}
              curve="monotoneX"
              colors={colors}
              lineWidth={2.5}
              enablePoints={true}
              pointSize={6}
              pointColor="#ffffff"
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              enableArea={single}
              areaOpacity={1}
              enableGridX={false}
              enableGridY={true}
              enableSlices="x"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 0,
                tickPadding: 8,
                tickValues,
                format: (v: string) => v,
              }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 6,
                format: (v: number) => (Number.isInteger(v) ? String(v) : ''),
              }}
              legends={[]}
              markers={[]}
              layers={['grid', 'markers', 'axes', 'areas', 'crosshair', 'lines', 'points', 'slices', 'mesh', 'legends']}
              defs={defs}
              fill={fill}
              sliceTooltip={({ slice }: any) => (
                <div className="bg-white rounded-lg shadow-lg px-3 py-2 text-xs border border-slate-100">
                  <div className="mb-1 font-semibold text-slate-700">Week of {slice.points[0]?.data?.xFormatted}</div>
                  <div className="space-y-0.5">
                    {slice.points.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.serieColor }} />
                        <span className="text-slate-600">{p.serieId}</span>
                        <span className="ml-auto pl-3 text-slate-400">{p.data.yFormatted}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            />
          </ChartContainer>
          <ChartLegend
            testId="quran-progress-chart-legend"
            items={series.map(s => ({ label: s.id, color: s.color, count: s.total }))}
          />
        </div>
      )}
    </section>
  )
}
