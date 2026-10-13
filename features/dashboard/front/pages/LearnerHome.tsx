'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import { plannerApi } from '@/features/plan/front/services/api'
import { quranApi } from '@/features/quran/front/services/api'
import { buildDailySchedule } from '@/features/schedule/server/service'
import { courseTimesFromSubjects } from '@/features/schedule/lib/courseTimes'
import { PersonalTodoList } from '@/features/todos/front/components/PersonalTodoList'
import { IslamicCalendarCard } from '@/features/islamic-calendar/front/components/IslamicCalendarCard'
import { getIslamicCalendarCountdowns } from '@/features/islamic-calendar/front/lib/countdowns'
import { useIslamicReminderSettings } from '@/features/islamic-calendar/front/lib/useIslamicReminderSettings'
import { TodaySchedulePanel } from '../components/TodaySchedulePanel'
import { QuranStreak } from '../components/QuranStreak'
import { LearningTimeWeekCard } from '../components/LearningTimeWeekCard'
import { dashboardDateToStr } from '../components/DashboardDatePicker'
import type { LessonTask } from '@/features/plan/types'
import type { QuranSession } from '@/features/lib/types'
import type { DaySchedule } from '@/features/schedule/types'

function currentTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

/**
 * A learner login's Home: "My day". Only the learner's own things, from endpoints the
 * learner policy allows — the parent Dashboard loads household-wide, parent-only data and
 * failed for learners with "Error Loading Dashboard" (UAT 8.3, 2026-10-12).
 */
export function LearnerHome() {
  const { studentProfiles, allSubjects } = useHousehold()
  const { selectedChildId } = useLearner()
  // The server gives a learner's shell only their own profile.
  const me = studentProfiles.length === 1 ? studentProfiles[0] : studentProfiles.find(c => c.id === selectedChildId)
  const ownId = me?.id ?? null
  const firstName = me?.firstName || me?.name.split(' ')[0] || ''

  const today = useMemo(() => dashboardDateToStr(new Date()), [])
  const todayLabel = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    [],
  )

  const [lessons, setLessons] = useState<LessonTask[]>([])
  const [lessonsState, setLessonsState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [markError, setMarkError] = useState('')
  const [quranSessions, setQuranSessions] = useState<QuranSession[]>([])

  const loadLessons = useCallback(() => {
    if (!ownId) return
    setLessonsState('loading')
    plannerApi.getLessons(undefined, [ownId], undefined, today, today)
      .then(rows => { setLessons(rows); setLessonsState('ready') })
      .catch(() => setLessonsState('error'))
  }, [ownId, today])

  const loadQuran = useCallback(() => {
    if (!ownId) return
    quranApi.getSessions(ownId)
      .then(res => setQuranSessions(res.data.sessions))
      .catch(() => {})
  }, [ownId])

  useEffect(() => { loadLessons() }, [loadLessons])
  useEffect(() => { loadQuran() }, [loadQuran])

  const courseTimes = useMemo(() => courseTimesFromSubjects(allSubjects ?? []), [allSubjects])
  const schedule = useMemo((): DaySchedule => ({
    ...buildDailySchedule(lessons, {
      startTime: '08:30',
      transitionMinutes: 10,
      defaultDurationMinutes: 30,
      includeSyntheticBreaks: true,
      date: today,
      courseTimes,
    }),
    date: today,
  }), [lessons, today, courseTimes])

  async function markDone(lessonId: string) {
    setMarkError('')
    try {
      const updated = await plannerApi.completeLesson(lessonId)
      setLessons(prev => prev.map(l => (l.id === lessonId ? { ...l, status: updated.status } : l)))
    } catch {
      const title = lessons.find(l => l.id === lessonId)?.title ?? 'that lesson'
      setMarkError(`Couldn’t mark “${title}” done. Please try again.`)
    }
  }

  async function addQuranSession(session: Record<string, unknown>) {
    await quranApi.addSession({ ...session, childId: ownId } as Parameters<typeof quranApi.addSession>[0])
    loadQuran()
  }

  const { enabled: reminderEnabled } = useIslamicReminderSettings()
  const islamicEvents = getIslamicCalendarCountdowns(today)
    .slice(0, 3)
    .filter(c => reminderEnabled[c.name])
    .map(c => ({ id: c.id, event: c.name, daysUntil: c.daysUntil, description: c.description }))

  return (
    <div className="bg-slate-50 min-h-screen" data-testid="learner-home">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="page-title mb-0">Marhaba{firstName ? `, ${firstName}` : ''}</h1>
          <p className="text-sm text-slate-500">{todayLabel} · My day</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            {markError && (
              <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{markError}</p>
            )}
            {lessonsState === 'loading' && (
              <section className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-sm text-slate-400">Loading your day…</p>
              </section>
            )}
            {lessonsState === 'error' && (
              <section className="bg-white rounded-xl border border-slate-200 p-5">
                <p role="alert" className="text-sm text-red-700">Couldn’t load today’s lessons.</p>
                <button
                  type="button"
                  onClick={loadLessons}
                  className="mt-3 px-4 py-2 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800"
                >
                  Try again
                </button>
              </section>
            )}
            {lessonsState === 'ready' && lessons.length === 0 && (
              <section className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-lg font-bold text-slate-900 mb-2">Today&apos;s Schedule</h2>
                <p className="text-sm text-slate-600">Nothing planned for today.</p>
                <Link href="/learning-time" className="inline-block mt-3 text-sm font-medium text-forest-900 hover:underline">
                  ▶ Start learning time
                </Link>
              </section>
            )}
            {lessonsState === 'ready' && lessons.length > 0 && (
              <TodaySchedulePanel
                schedule={schedule}
                currentTime={currentTime()}
                subjects={allSubjects}
                learnerId={ownId}
                canEdit={false}
                onMarkDone={markDone}
              />
            )}
          </div>
          <aside>
            <QuranStreak
              quranSessions={quranSessions}
              children={me ? [me] : []}
              selectedChildId={ownId}
              onAddSession={addQuranSession}
            />
          </aside>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
          <LearningTimeWeekCard />
          <IslamicCalendarCard events={islamicEvents} />
        </div>
        <PersonalTodoList />
      </div>
    </div>
  )
}
