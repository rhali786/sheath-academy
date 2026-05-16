'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TodayState } from '../components/TodayState'
import { DoToday } from '../components/DoToday'
import { NeedsAttention } from '../components/NeedsAttention'
import { PerChildProgress } from '../components/PerChildProgress'
import { QuranStudies } from '../components/QuranStudies'
import { RecordsProof } from '../components/RecordsProof'
import { useContext_Dashboard } from '../context'
import { useHousehold } from '@/features/household/front/context'
import { HouseholdSetup } from '@/features/household/front/components/HouseholdSetup'
import { dashboardApi } from '../services/api'
import { useNavigation } from '@/features/layout/front/context/NavigationContext'
import type { Child } from '../types'
import { ChildSelector } from '../components/ChildSelector'
import { NextSetupStrip } from '@/features/setup/front/components/NextSetupStrip'
import { SubjectProgressCard } from '../components/SubjectProgressCard'
import { RecentLessonsCard } from '../components/RecentLessonsCard'
import { WeekAttendanceCard } from '../components/WeekAttendanceCard'

export default function Dashboard() {
  const { selectedTab } = useNavigation()
  const {
    children: studentProfiles, tasks, alerts, quranSessions, records, metrics,
    loading, error, toggleTask, addQuranSession, selectedChildId,
  } = useContext_Dashboard()

  // Map StudentProfile[] to legacy Child[] for existing components
  const children: Child[] = studentProfiles.map(p => ({
    id: p.id,
    name: p.name,
    age: 0,
    grade: parseInt(p.gradeLabel.replace(/\D/g, '')) || 0,
    avatar: p.avatarInitials || p.name.charAt(0).toUpperCase(),
  }))
  const { needsSetup, loading: householdLoading } = useHousehold()

  const [progressData, setProgressData] = useState({})

  useEffect(() => {
    dashboardApi.getProgress()
      .then(res => setProgressData(res.data))
      .catch(err => console.error('Failed to fetch progress data:', err))
  }, [])

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

          <PerChildProgress children={children} progressData={progressData} />
          <QuranStudies children={children} quranSessions={quranSessions} onAddSession={addQuranSession} />
          <RecordsProof records={records} />

          <div className="pb-6 text-center">
            <Link href="/worklog" className="text-xs text-slate-300 hover:text-slate-400 transition-colors">
              worklog
            </Link>
          </div>
        </>
      )}

      {selectedTab === 'Reports' && (
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SubjectProgressCard childId={selectedChildId ?? undefined} />
            <WeekAttendanceCard childId={selectedChildId} />
            <RecentLessonsCard childId={selectedChildId ?? undefined} limit={10} />
          </div>
        </div>
      )}

    </div>
  )
}
