'use client'

import React, { useEffect, useState } from 'react'
import { SetupCard } from './SetupCard'
import { SubjectForm } from '@/features/subjects/front/components/SubjectForm'
import { SubjectList } from '@/features/subjects/front/components/SubjectList'
import { childrenApi } from '@/features/children/front/services/api'

export interface SetupCard_SubjectsProps {
  onSubjectAdded?: () => void
}

export function SetupCard_Subjects({ onSubjectAdded }: SetupCard_SubjectsProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [primaryChildId, setPrimaryChildId] = useState<string | null>(null)

  useEffect(() => {
    childrenApi
      .getAllChildren(false)
      .then((res) => {
        const active = (res.data ?? []).filter((c) => c.isActive !== false)
        setPrimaryChildId(active[0]?.id ?? null)
      })
      .catch(() => setPrimaryChildId(null))
  }, [refreshKey])

  return (
    <SetupCard
      testId="setup-card-subjects"
      title="Add subjects for your children"
      description="Create at least one subject for a child so your dashboard can track learning by topic."
    >
      <SubjectForm
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
