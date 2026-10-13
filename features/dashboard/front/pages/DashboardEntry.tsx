'use client'

import { DashboardProvider } from '@/features/dashboard/front/context'
import { ActiveSchoolYearProvider } from '@/features/school-year/front/context/ActiveSchoolYearContext'
import { useViewerRole } from '@/features/auth/front/viewerRole'
import Dashboard from './Dashboard'
import { LearnerHome } from './LearnerHome'

/**
 * Home for whoever is signed in. A learner gets "My day"; the parent Dashboard's providers
 * load parent-only data, so they must never mount for a learner (UAT 8.3, 2026-10-12).
 * Nothing renders until the session is known, so a learner never starts those loads.
 */
export function DashboardEntry() {
  const { isLearner, known } = useViewerRole()
  if (!known) return null
  if (isLearner) return <LearnerHome />
  return (
    <ActiveSchoolYearProvider>
      <DashboardProvider>
        <Dashboard />
      </DashboardProvider>
    </ActiveSchoolYearProvider>
  )
}
