'use client'

import React from 'react'
import { SetupCard } from './SetupCard'

export function SetupCard_Subjects() {
  return (
    <SetupCard
      testId="setup-card-subjects"
      title="Add subjects for your children"
      description="Define the subjects each child will study — Quran, Maths, Arabic, and more. Subject setup is coming in the next release."
      actionLabel="Add subjects"
      disabled
      disabledTooltip="Coming in next release"
    />
  )
}
