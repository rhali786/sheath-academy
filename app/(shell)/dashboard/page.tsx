'use client'

import { DashboardProvider } from '@/features/dashboard/front/context'
import { ActiveSchoolYearProvider } from '@/features/school-year/front/context/ActiveSchoolYearContext'
import Dashboard from '@/features/dashboard/front/pages/Dashboard'

export default function Page() {
  return (
    <ActiveSchoolYearProvider>
      <DashboardProvider>
        <Dashboard />
      </DashboardProvider>
    </ActiveSchoolYearProvider>
  )
}
