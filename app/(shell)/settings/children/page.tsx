'use client'

import { useHousehold } from '@/features/household/front/context'
import { ChildrenProvider } from '@/features/children/front/context'
import { ChildList } from '@/features/children/front/components/ChildList'

export default function ChildrenSettingsPage() {
  const { workspace } = useHousehold()

  if (!workspace) {
    return <div className="p-6 text-center text-slate-500">Loading...</div>
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Manage children</h1>
        <p className="text-sm text-slate-600 mt-1">Add and manage profiles for each child in your household.</p>
      </div>

      <ChildrenProvider householdId={workspace.id}>
        <ChildList />
      </ChildrenProvider>
    </div>
  )
}
