import React from 'react'
import { render, screen } from '@testing-library/react'
import { QuranProgressChart } from '@/features/quran/front/components/QuranProgressChart'
import type { QuranSession } from '@/features/lib/types'

function makeSession(id: string, date: string): QuranSession {
  return {
    id,
    childId: 'child_001',
    type: 'Revision',
    surah: 'Al-Fatiha',
    fromAyah: 1,
    toAyah: 7,
    date,
    notes: '',
  } as QuranSession
}

describe('QuranProgressChart', () => {
  it('renders a loading skeleton', () => {
    render(<QuranProgressChart sessions={[]} loading />)
    expect(screen.getByTestId('quran-progress-chart-loading')).toBeInTheDocument()
  })

  it('renders a polished empty state when there are no sessions', () => {
    render(<QuranProgressChart sessions={[]} loading={false} />)
    expect(screen.getByTestId('quran-progress-chart-empty')).toBeInTheDocument()
    expect(screen.getByText('No Quran sessions logged yet')).toBeInTheDocument()
  })

  it('renders the populated chart container when sessions exist', () => {
    const sessions = [
      makeSession('s1', '2026-05-10'),
      makeSession('s2', '2026-05-12'),
      makeSession('s3', '2026-05-18'),
    ]
    render(<QuranProgressChart sessions={sessions} loading={false} />)
    expect(screen.getByTestId('quran-progress-chart-populated')).toBeInTheDocument()
    expect(screen.getByText('Memorization progress')).toBeInTheDocument()
  })
})
