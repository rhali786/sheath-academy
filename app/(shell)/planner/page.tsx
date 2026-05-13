import { Suspense } from 'react'
import PlannerPage from '@/features/planner/front/pages'

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500">Loading...</div>}>
      <PlannerPage />
    </Suspense>
  )
}
