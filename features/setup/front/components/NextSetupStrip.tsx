'use client'

import { useEffect, useState } from 'react'
import type { SetupStatus, SetupStep } from '@/features/setup/types'

const STEP_MESSAGES: Record<SetupStep, { title: string; detail: string; stub?: boolean }> = {
  household: {
    title: 'Set up your household',
    detail: 'Create your workspace and family name to get started.',
  },
  firstChild: {
    title: 'Add your first child',
    detail: 'Add a learner profile so you can assign subjects and tasks.',
  },
  firstSubject: {
    title: 'Add a subject',
    detail: 'Create at least one subject for a child from the setup screen or settings.',
  },
  firstLesson: {
    title: 'Plan your first lesson',
    detail: 'Lesson planning is coming soon.',
    stub: true,
  },
  firstAttendance: {
    title: 'Mark attendance',
    detail: 'Attendance tracking is coming soon.',
    stub: true,
  },
  firstPortfolio: {
    title: 'Add portfolio evidence',
    detail: 'Portfolio uploads are coming soon.',
    stub: true,
  },
}

export function NextSetupStrip() {
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/setup-status')
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return
        if (body.status === 'success' && body.data) {
          setStatus(body.data as SetupStatus)
        } else {
          setStatus(null)
        }
      })
      .catch(() => {
        if (!cancelled) setStatus(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading || !status?.nextStep) {
    return null
  }

  const step = status.nextStep
  const meta = STEP_MESSAGES[step]

  return (
    <div
      className="bg-forest-50 border-b border-forest-100"
      data-testid="next-setup-strip"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-forest-900">{meta.title}</p>
          <p className="text-xs text-forest-800/80 mt-0.5">{meta.detail}</p>
        </div>
        {meta.stub ? (
          <button
            type="button"
            disabled
            title="Coming soon"
            className="self-start text-xs px-3 py-1.5 rounded-lg border border-forest-200 text-forest-700 opacity-60 cursor-not-allowed"
          >
            Coming soon
          </button>
        ) : null}
      </div>
    </div>
  )
}
