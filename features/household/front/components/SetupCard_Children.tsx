'use client'

import React, { useState } from 'react'
import { SetupCard } from './SetupCard'
import { ChildForm } from '@/features/children/front/components/ChildForm'
import type { StudentProfile } from '@/features/lib/types'
import { childrenApi } from '@/features/children/front/services/api'

interface SetupCard_ChildrenProps {
  householdId: string
  onChildAdded?: () => void
}

export function SetupCard_Children({ householdId, onChildAdded }: SetupCard_ChildrenProps) {
  const [showForm, setShowForm] = useState(false)

  async function handleSubmit(
    data: Partial<StudentProfile> & {
      householdId: string
      name: string
      gradeLabel: string
      username: string
      password: string
    }
  ) {
    await childrenApi.createChild(data)
    setShowForm(false)
    onChildAdded?.()
  }

  if (showForm) {
    return (
      <div
        data-testid="setup-card-children"
        className="bg-white rounded-xl border border-slate-200 p-6"
      >
        <h2 className="text-base font-semibold text-slate-900 mb-1">Add your first child</h2>
        <p className="text-sm text-slate-500 mb-4">
          Create a profile for each child you are home-educating.
        </p>
        <ChildForm
          householdId={householdId}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      </div>
    )
  }

  return (
    <SetupCard
      testId="setup-card-children"
      title="Add your first child"
      description="Create profiles for each child in your household so you can track their lessons, attendance, and progress."
      actionLabel="Add child"
      onAction={() => setShowForm(true)}
    />
  )
}
