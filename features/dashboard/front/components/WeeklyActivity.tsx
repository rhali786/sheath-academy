'use client'

import { useMemo } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import { ChartContainer } from './shared/ChartContainer'
import { nivoTheme, childColors } from '../theme'
import type { QuranSession } from '../types'
import type { LessonTask } from '@/features/planner/types'
import type { StudentProfile } from '@/features/lib/types'

interface WeeklyActivityProps {
  lessons: LessonTask[]
  quranSessions: QuranSession[]
  children: StudentProfile[]
  selectedChildId: string | null
}

const LESSON_COLOR = '#1a5c3a'
const QURAN_COLOR  = '#0284c7'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getWeekDates(): { date: string; dayLabel: string }[] {
  const today = new Date()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  return DAY_LABELS.map((dayLabel, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return { date: `${y}-${m}-${dd}`, dayLabel }
  })
}

export function WeeklyActivity({ lessons, quranSessions, children, selectedChildId }: WeeklyActivityProps) {
  const weekDays = useMemo(getWeekDates, [])
  const weekDates = new Set(weekDays.map(d => d.date))

  const activeChildren = selectedChildId
    ? children.filter(c => c.id === selectedChildId)
    : children

  // Build chart data
  const { data, keys, colors, isEmpty } = useMemo(() => {
    if (selectedChildId) {
      // Single child — stacked: lessons (bottom) + quran (top)
      const completedLessons = lessons.filter(
        l => l.status === 'completed' && l.childId === selectedChildId
      )
      const childSessions = quranSessions.filter(s => s.childId === selectedChildId)

      const data = weekDays.map(({ date, dayLabel }) => ({
        day: dayLabel,
        lessons: completedLessons.filter(l => l.updatedAt.slice(0, 10) === date).length,
        quranSessions: childSessions.filter(s => s.date === date).length,
      }))

      const isEmpty = data.every(d => d.lessons === 0 && d.quranSessions === 0)
      return { data, keys: ['lessons', 'quranSessions'], colors: [LESSON_COLOR, QURAN_COLOR], isEmpty }
    } else {
      // All children — grouped: one bar per child per day, total activity
      const data = weekDays.map(({ date, dayLabel }) => {
        const row: Record<string, string | number> = { day: dayLabel }
        activeChildren.forEach(child => {
          const lessonCount = lessons.filter(
            l => l.status === 'completed' && l.childId === child.id && l.updatedAt.slice(0, 10) === date
          ).length
          const quranCount = quranSessions.filter(s => s.childId === child.id && s.date === date).length
          row[child.name] = lessonCount + quranCount
        })
        return row
      })

      const keys = activeChildren.map(c => c.name)
      const colors = activeChildren.map((_, i) => childColors[i] || childColors[childColors.length - 1])
      const isEmpty = data.every(d => keys.every(k => d[k] === 0))
      return { data, keys, colors, isEmpty }
    }
  }, [lessons, quranSessions, weekDays, selectedChildId, activeChildren])

  return (
    <section className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
        Weekly Activity
      </p>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap mb-4">
        {selectedChildId ? (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LESSON_COLOR }} />
              <span className="text-xs text-slate-500 font-medium">Lessons</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: QURAN_COLOR }} />
              <span className="text-xs text-slate-500 font-medium">Quran</span>
            </div>
          </>
        ) : (
          activeChildren.map((child, i) => (
            <div key={child.id} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: childColors[i] || childColors[childColors.length - 1] }} />
              <span className="text-xs text-slate-500 font-medium">{child.name}</span>
            </div>
          ))
        )}
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center h-[220px]">
          <p className="text-sm text-slate-400">No learning activity logged this week.</p>
        </div>
      ) : (
        <ChartContainer height={220}>
          <ResponsiveBar
            data={data}
            keys={keys}
            indexBy="day"
            groupMode={selectedChildId ? 'stacked' : 'grouped'}
            layout="vertical"
            margin={{ top: 10, right: 16, bottom: 32, left: 32 }}
            colors={colors}
            theme={nivoTheme}
            axisBottom={{
              tickSize: 0,
              tickPadding: 8,
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 6,
              format: (v: number) => Number.isInteger(v) ? String(v) : '',
            }}
            enableLabel={false}
            enableGridY={true}
            enableGridX={false}
            borderRadius={3}
            padding={selectedChildId ? 0.3 : 0.2}
            innerPadding={selectedChildId ? 0 : 2}
            tooltip={({ id, value, indexValue, color: c }) => (
              <div className="bg-white rounded-lg shadow-lg px-3 py-2 text-xs border border-slate-100">
                <span className="font-semibold" style={{ color: c }}>{id as string}</span>
                <span className="text-slate-500 ml-1.5">· {indexValue} · {value}</span>
              </div>
            )}
          />
        </ChartContainer>
      )}
    </section>
  )
}
