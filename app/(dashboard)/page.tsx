'use client'

import { DashboardProvider } from '@/features/dashboard/front/context'
import { HouseholdProvider } from '@/features/household/front/context'
import Dashboard from '@/features/dashboard/front/pages/Dashboard'

export default function Home() {
  return (
    <HouseholdProvider>
      <DashboardProvider>
        <Dashboard />
      </DashboardProvider>
    </HouseholdProvider>
  )
}
