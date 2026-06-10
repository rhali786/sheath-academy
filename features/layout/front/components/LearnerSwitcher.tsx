'use client'

import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'

export function LearnerSwitcher() {
  const { studentProfiles } = useHousehold()
  const { selectedChildId, setSelectedChildId } = useLearner()

  const activeLearners = studentProfiles.filter((c) => c.isActive !== false)
  if (activeLearners.length < 2) return null

  return (
    <select
      aria-label="Viewing learner"
      data-testid="learner-switcher"
      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-800 min-w-[8rem] max-w-[12rem]"
      value={selectedChildId ?? ''}
      onChange={(e) => setSelectedChildId(e.target.value === '' ? null : e.target.value)}
    >
      <option value="">All children</option>
      {activeLearners.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}
