'use client'

import { DashboardProvider } from '@/app/providers'
import Dashboard from '@/features/dashboard/front/pages/Dashboard'

export default function Home() {
  return (
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  )
}
