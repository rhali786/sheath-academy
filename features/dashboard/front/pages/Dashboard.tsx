'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { SchoolYearProgressCard } from '../components/SchoolYearProgressCard'
import { DoToday } from '../components/DoToday'
import { NeedsAttention } from '../components/NeedsAttention'
import { WeeklyActivity } from '../components/WeeklyActivity'
import { SubjectActivity } from '../components/SubjectActivity'
import { QuranStreak } from '../components/QuranStreak'
import { RecordsProof } from '../components/RecordsProof'
import { IslamicCalendarCard } from '@/features/islamic-calendar/front/components/IslamicCalendarCard'
import { getIslamicCalendarCountdowns } from '@/features/islamic-calendar/front/lib/countdowns'
import { useIslamicReminderSettings } from '@/features/islamic-calendar/front/lib/useIslamicReminderSettings'
import { buildDailySchedule } from '@/features/schedule/server/service'
import { useContext_Dashboard } from '../context'
import { useHousehold } from '@/features/household/front/context'
import { HouseholdSetup } from '@/features/household/front/components/HouseholdSetup'
import { NextSetupStrip } from '@/features/setup/front/components/NextSetupStrip'
import { plannerApi } from '@/features/plan/front/services/api'
import { subjectsApi } from '@/features/subjects/front/services/api'
import { DashboardHeader } from '../components/DashboardHeader'
import { TodayTaskSummaryCards } from '../components/TodayTaskSummaryCards'
import { TodaySchedulePanel } from '../components/TodaySchedulePanel'
import type { LessonTask } from '@/features/plan/types'
import type { SubjectCourse } from '@/features/subjects/types'
import type { DaySchedule } from '@/features/schedule/types'

function getTodayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function getCurrentTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export default function Dashboard() {
  const {
    children: studentProfiles, alerts, quranSessions, records, metrics,
    loading, error, addQuranSession, selectedChildId,
  } = useContext_Dashboard()

  const { needsSetup, loading: householdLoading } = useHousehold()

  const [allLessons, setAllLessons] = useState<LessonTask[]>([])
  const [subjects, setSubjects] = useState<SubjectCourse[]>([])

  const islamicCountdowns = useMemo(() => getIslamicCalendarCountdowns(getTodayStr()), [])
  const topCountdowns = islamicCountdowns.slice(0, 3)
  const { enabled: reminderEnabled } = useIslamicReminderSettings()

  const weeklyLessons = useMemo(() => {
    const today = new Date()
    const sunday = new Date(today)
    sunday.setDate(today.getDate() - today.getDay())
    sunday.setHours(0, 0, 0, 0)
    const saturday = new Date(sunday)
    saturday.setDate(sunday.getDate() + 6)
    saturday.setHours(23, 59, 59, 999)
    return allLessons.filter(l => {
      if (l.status !== 'completed') return false
      const updated = new Date(l.updatedAt)
      return updated >= sunday && updated <= saturday
    })
  }, [allLessons])

  const todaySchedule = useMemo((): DaySchedule => {
    const todayStr = getTodayStr()
    const todayLessons = allLessons
      .filter(l => l.dueDate === todayStr)
      .sort((a, b) => a.order - b.order)
    return buildDailySchedule(todayLessons, {
      startTime: '08:30',
      transitionMinutes: 10,
      defaultDurationMinutes: 30,
    })
  }, [allLessons])

  useEffect(() => {
    subjectsApi.getSubjects().then(res => setSubjects(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    plannerApi.getLessons(undefined, selectedChildId ? [selectedChildId] : undefined)
      .then(lessons => setAllLessons(lessons))
      .catch(() => {})
  }, [selectedChildId])

  if (loading || householdLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-forest-100 border-t-forest-900 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center max-w-sm">
          <p className="text-red-600 font-semibold mb-2">Error Loading Dashboard</p>
          <p className="text-slate-500 text-sm mb-5">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (needsSetup) {
    return <HouseholdSetup />
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <NextSetupStrip />
      <DashboardHeader />
      <TodayTaskSummaryCards metrics={metrics} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3" data-testid="dashboard-hero-grid">
          <div className="lg:col-span-2">
            <TodaySchedulePanel schedule={todaySchedule} currentTime={getCurrentTime()} />
          </div>
          <aside data-testid="dashboard-alerts-rail">
            <NeedsAttention alerts={alerts} />
          </aside>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" data-testid="dashboard-more-insights">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <DoToday />
            <SubjectActivity
              lessons={weeklyLessons}
              subjects={subjects}
              children={studentProfiles}
              selectedChildId={selectedChildId}
            />
          </div>
          <div className="space-y-6">
            <SchoolYearProgressCard />
            <QuranStreak
              quranSessions={quranSessions}
              children={studentProfiles}
              selectedChildId={selectedChildId}
              onAddSession={addQuranSession}
            />
            {topCountdowns.filter(c => reminderEnabled[c.name]).map(c => (
              <IslamicCalendarCard
                key={c.id}
                event={c.name}
                daysUntil={c.daysUntil}
                description={c.description}
              />
            ))}
          </div>
        </div>

        <WeeklyActivity
          lessons={weeklyLessons}
          quranSessions={quranSessions}
          children={studentProfiles}
          selectedChildId={selectedChildId}
        />

        <RecordsProof records={records} selectedChildId={selectedChildId} />
      </section>

      <div className="pb-6 text-center">
        <Link href="/worklog" className="text-xs text-slate-300 hover:text-slate-400 transition-colors">
          worklog
        </Link>
      </div>
    </div>
  )
}
