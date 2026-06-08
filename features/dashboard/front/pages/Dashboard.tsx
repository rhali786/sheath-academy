'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { SchoolYearProgressCard } from '../components/SchoolYearProgressCard'
import { NeedsAttention } from '../components/NeedsAttention'
import { PersonalAssistantPanel } from '../components/PersonalAssistantPanel'
import { QuranStreak } from '../components/QuranStreak'
import { PersonalTodoList } from '@/features/todos/front/components/PersonalTodoList'
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
import { DashboardHeader } from '../components/DashboardHeader'
import { dashboardDateToStr } from '../components/DashboardDatePicker'
import { getAssistantInsight } from '../lib/assistantRules'
import { TodayTaskSummaryCards } from '../components/TodayTaskSummaryCards'
import { TodaySchedulePanel } from '../components/TodaySchedulePanel'
import type { LessonTask } from '@/features/plan/types'
import type { DaySchedule } from '@/features/schedule/types'

function getCurrentTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function isValidDateParam(dateStr: string | null): dateStr is string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const [year, month, day] = dateStr.split('-').map(Number)
  const parsed = new Date(year, month - 1, day)
  return dashboardDateToStr(parsed) === dateStr
}

export default function Dashboard() {
  const {
    children: studentProfiles, alerts, quranSessions, records, metrics,
    loading, error, addQuranSession, selectedChildId,
  } = useContext_Dashboard()

  const { needsSetup, loading: householdLoading, allSubjects } = useHousehold()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [allLessons, setAllLessons] = useState<LessonTask[]>([])
  const today = useMemo(() => dashboardDateToStr(new Date()), [])
  const dateParam = searchParams.get('date')
  const selectedDate = isValidDateParam(dateParam) ? dateParam : today

  const islamicCountdowns = useMemo(() => getIslamicCalendarCountdowns(selectedDate), [selectedDate])
  const topCountdowns = islamicCountdowns.slice(0, 3)
  const { enabled: reminderEnabled } = useIslamicReminderSettings()

  const dayLessons = useMemo(
    () => allLessons.filter(l => l.dueDate === selectedDate).sort((a, b) => a.order - b.order),
    [allLessons, selectedDate],
  )

  const assistantInsight = useMemo(
    () => getAssistantInsight({
      selectedDate,
      selectedChildId,
      lessons: dayLessons,
      alerts,
      subjects: allSubjects,
    }),
    [alerts, allSubjects, dayLessons, selectedChildId, selectedDate],
  )

  const daySchedule = useMemo((): DaySchedule => {
    return { ...buildDailySchedule(dayLessons, {
      startTime: '08:30',
      transitionMinutes: 10,
      defaultDurationMinutes: 30,
      includeSyntheticBreaks: true,
    }), date: selectedDate }
  }, [allLessons, selectedDate])


  useEffect(() => {
    plannerApi.getLessons(
      undefined,
      selectedChildId ? [selectedChildId] : undefined,
      undefined,
      selectedDate,
      selectedDate,
    )
      .then(lessons => setAllLessons(lessons))
      .catch(() => {})
  }, [selectedChildId, selectedDate])

  useEffect(() => {
    if (dateParam && !isValidDateParam(dateParam)) {
      router.replace(`${pathname}?date=${today}`)
    }
  }, [dateParam, pathname, router, today])

  function handleDateChange(nextDate: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('date', nextDate)
    router.push(`${pathname}?${params.toString()}`)
  }

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
      <DashboardHeader
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        alerts={alerts}
      />
      <TodayTaskSummaryCards metrics={metrics} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3" data-testid="dashboard-hero-grid">
          <div className="lg:col-span-2">
            <TodaySchedulePanel
              schedule={daySchedule}
              currentTime={getCurrentTime()}
              subjects={allSubjects}
            />
          </div>
          <aside className="space-y-6" data-testid="dashboard-alerts-rail">
            <PersonalAssistantPanel insight={assistantInsight} />
            <PersonalTodoList />
            <NeedsAttention alerts={alerts} />
          </aside>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" data-testid="dashboard-more-insights">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecordsProof records={records} selectedChildId={selectedChildId} />
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
      </section>

      <div className="pb-6 text-center">
        <Link href="/worklog" className="text-xs text-slate-300 hover:text-slate-400 transition-colors">
          worklog
        </Link>
      </div>
    </div>
  )
}
