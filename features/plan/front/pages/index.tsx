'use client'

import { WeeklyPlannerPage } from '../components/WeeklyPlannerPage'
import { PlannerProvider } from '../context/PlannerContext'

export default function PlannerPage() {
  return (
    <PlannerProvider>
      <WeeklyPlannerPage />
    </PlannerProvider>
  )
}
