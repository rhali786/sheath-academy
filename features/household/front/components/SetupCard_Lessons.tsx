'use client'

import React from 'react'
import { SetupCard } from './SetupCard'

export function SetupCard_Lessons() {
  return (
    <SetupCard
      testId="setup-card-lessons"
      title="Create your first lesson plan"
      description="Organise daily lessons for each child. Lesson planning is coming soon."
      actionLabel="Set up lessons"
      disabled
      disabledTooltip="Coming soon"
    />
  )
}
