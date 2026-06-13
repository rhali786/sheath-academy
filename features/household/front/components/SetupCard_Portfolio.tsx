'use client'

import React from 'react'
import { SetupCard } from './SetupCard'

export function SetupCard_Portfolio() {
  return (
    <SetupCard
      testId="setup-card-portfolio"
      title="Start your portfolio"
      description="Capture evidence of learning for each child."
      actionLabel="Start portfolio"
      actionHref="/portfolio"
    />
  )
}
