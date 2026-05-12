'use client'

import React from 'react'
import { SetupCard } from './SetupCard'

export function SetupCard_Portfolio() {
  return (
    <SetupCard
      testId="setup-card-portfolio"
      title="Start your portfolio"
      description="Collect work samples and achievements for each child. Portfolio is coming soon."
      actionLabel="Start portfolio"
      disabled
      disabledTooltip="Coming soon"
    />
  )
}
