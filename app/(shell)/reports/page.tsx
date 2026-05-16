'use client'

import { DashboardProvider } from '@/features/dashboard/front/context'
import { ReportsPage } from '@/features/reports/front/pages/ReportsPage'

export default function Page() {
  return (
    <DashboardProvider>
      <ReportsPage />
    </DashboardProvider>
  )
}
