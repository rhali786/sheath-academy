'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TodayState } from '../components/TodayState'
import { DoToday } from '../components/DoToday'
import { NeedsAttention } from '../components/NeedsAttention'
import { WeeklyActivity } from '../components/WeeklyActivity'
import { SubjectActivity } from '../components/SubjectActivity'
import { QuranStreak } from '../components/QuranStreak'
import { RecordsProof } from '../components/RecordsProof'
import { useContext_Dashboard } from '../context'
import { useHousehold } from '@/features/household/front/context'
import { HouseholdSetup } from '@/features/household/front/components/HouseholdSetup'
import { useNavigation } from '@/features/layout/front/context/NavigationContext'
import { ChildSelector } from '../components/ChildSelector'
import { NextSetupStrip } from '@/features/setup/front/components/NextSetupStrip'
import { plannerApi } from '@/features/plan/front/services/api'
import { subjectsApi } from '@/features/subjects/front/services/api'
import type { LessonTask } from '@/features/plan/types'
import type { SubjectCourse } from '@/features/subjects/types'
import type { StudentProfile } from '@/features/lib/types'

export default function Dashboard() {
  const { selectedTab } = useNavigation()
  const {
    children: studentProfiles, alerts, quranSessions, records, metrics,
    loading, error, addQuranSession, selectedChildId,
  } = useContext_Dashboard()

  const { needsSetup, loading: householdLoading } = useHousehold()

  const [weeklyLessons, setWeeklyLessons] = useState<LessonTask[]>([])
  const [subjects, setSubjects] = useState<SubjectCourse[]>([])

  // Fetch subjects once
  useEffect(() => {
    subjectsApi.getSubjects().then(res => setSubjects(res.data)).catch(() => {})
  }, [])

  // Fetch all lessons and filter to current week completed
  useEffect(() => {
    plannerApi.getLessons(undefined, selectedChildId ? [selectedChildId] : undefined)
      .then(lessons => {
        const today = new Date()
        const sunday = new Date(today)
        sunday.setDate(today.getDate() - today.getDay())
        sunday.setHours(0, 0, 0, 0)
        const saturday = new Date(sunday)
        saturday.setDate(sunday.getDate() + 6)
        saturday.setHours(23, 59, 59, 999)

        setWeeklyLessons(lessons.filter(l => {
          if (l.status !== 'completed') return false
          const updated = new Date(l.updatedAt)
          return updated >= sunday && updated <= saturday
        }))
      })
      .catch(() => {})
  }, [selectedChildId])

  if (loading || householdLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-forest-100 border-t-forest-900 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400 font-medium">Loading dashboard…</p>
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

      {selectedTab === 'Today' && (
        <>
          <NextSetupStrip />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 flex justify-end">
            <ChildSelector />
          </div>
          <TodayState metrics={metrics} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <DoToday />
              </div>
              <div>
                <NeedsAttention alerts={alerts} />
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <WeeklyActivity
              lessons={weeklyLessons}
              quranSessions={quranSessions}
              children={studentProfiles}
              selectedChildId={selectedChildId}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SubjectActivity
                lessons={weeklyLessons}
                subjects={subjects}
                children={studentProfiles}
                selectedChildId={selectedChildId}
              />
              <QuranStreak
                quranSessions={quranSessions}
                children={studentProfiles}
                selectedChildId={selectedChildId}
                onAddSession={addQuranSession}
              />
            </div>
          </div>

          <RecordsProof records={records} />

          <div className="pb-6 text-center">
            <Link href="/worklog" className="text-xs text-slate-300 hover:text-slate-400 transition-colors">
              worklog
            </Link>
          </div>
        </>
      )}

    </div>
  )
}
