'use client'

import React, { useEffect, useState } from 'react'
import { SetupCard } from './SetupCard'
import { SubjectForm } from '@/features/subjects/front/components/SubjectForm'
import { SubjectList } from '@/features/subjects/front/components/SubjectList'
import { childrenApi } from '@/features/children/front/services/api'
import { useHousehold } from '@/features/household/front/context'

export interface SetupCard_SubjectsProps {
  onSubjectAdded?: () => void
}

export function SetupCard_Subjects({ onSubjectAdded }: SetupCard_SubjectsProps) {
  const { workspace, householdProfile } = useHousehold()
  const [refreshKey, setRefreshKey] = useState(0)
  const [primaryChildId, setPrimaryChildId] = useState<string | null>(null)
  const householdId = householdProfile?.id ?? workspace?.id ?? ''

  useEffect(() => {
    if (!householdId) {
      setPrimaryChildId(null)
      return
    }
    childrenApi
      .getChildren(householdId, false)
      .then((res) => {
        const active = (res.data ?? []).filter((c) => c.isActive !== false)
        setPrimaryChildId(active[0]?.id ?? null)
      })
      .catch(() => setPrimaryChildId(null))
  }, [refreshKey, householdId])

  return (
    <SetupCard
      testId="setup-card-subjects"
      title="Add subjects for your children"
      description="Create at least one subject for a child so your dashboard can track learning by topic."
    >
      <SubjectForm
        householdId={householdId}
        onSuccess={() => {
          setRefreshKey((k) => k + 1)
          onSubjectAdded?.()
        }}
      />
      {primaryChildId && (
        <SubjectList childId={primaryChildId} refreshKey={refreshKey} />
      )}
    </SetupCard>
  )
}
