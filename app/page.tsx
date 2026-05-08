'use client'

import { DashboardProvider } from '@/app/providers'
import Dashboard from '@/app/frontend-src/pages/Dashboard'

export default function Home() {
  return (
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  )
}
