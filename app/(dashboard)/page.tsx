'use client'

import { DashboardProvider } from '@/features/dashboard/front/context'
import Dashboard from '@/features/dashboard/front/pages/Dashboard'

export default function Home() {
  return (
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  )
}
