'use client'

import { ChildrenProvider } from '@/features/children/front/context'
import { ChildList } from '@/features/children/front/components/ChildList'
import { useHousehold } from '@/features/household/front/context'

export function PeoplePage() {
  const { householdProfile, loading } = useHousehold()
  const householdId = householdProfile?.id

  if (loading || !householdId) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8" data-testid="people-page">
        <h1 className="page-title">People</h1>
        <p className="text-sm text-slate-500 py-8">Loading…</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" data-testid="people-page">
      <h1 className="page-title mb-6">People</h1>
      <ChildrenProvider householdId={householdId}>
        <ChildList />
      </ChildrenProvider>
    </div>
  )
}
