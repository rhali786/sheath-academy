import React from 'react'
import { render, screen } from '@testing-library/react'
import { QuranProgressChart } from '@/features/quran/front/components/QuranProgressChart'
import type { QuranSession, StudentProfile } from '@/features/lib/types'

function makeSession(id: string, date: string, childId = 'child_001'): QuranSession {
  return {
    id,
    childId,
    type: 'Revision',
    surah: 'Al-Fatiha',
    fromAyah: 1,
    toAyah: 7,
    date,
    notes: '',
  } as QuranSession
}

function makeStudent(id: string, name: string): StudentProfile {
  return { id, name } as StudentProfile
}

const students = [makeStudent('child_001', 'Aisha'), makeStudent('child_002', 'Yusuf')]

describe('QuranProgressChart', () => {
  it('renders a loading skeleton', () => {
    render(<QuranProgressChart sessions={[]} students={students} loading />)
    expect(screen.getByTestId('quran-progress-chart-loading')).toBeInTheDocument()
  })

  it('renders a polished empty state when there are no sessions', () => {
    render(<QuranProgressChart sessions={[]} students={students} loading={false} />)
    expect(screen.getByTestId('quran-progress-chart-empty')).toBeInTheDocument()
    expect(screen.getByText('No Quran sessions logged yet')).toBeInTheDocument()
  })

  it('renders the populated chart container when sessions exist', () => {
    const sessions = [
      makeSession('s1', '2026-05-10'),
      makeSession('s2', '2026-05-12'),
      makeSession('s3', '2026-05-18'),
    ]
    render(<QuranProgressChart sessions={sessions} students={students} loading={false} />)
    expect(screen.getByTestId('quran-progress-chart-populated')).toBeInTheDocument()
    expect(screen.getByText('Memorization progress')).toBeInTheDocument()
  })

  it('renders a legend with each learner and their session count', () => {
    const sessions = [
      makeSession('a1', '2026-05-10', 'child_001'),
      makeSession('a2', '2026-05-12', 'child_001'),
      makeSession('y1', '2026-05-18', 'child_002'),
    ]
    render(<QuranProgressChart sessions={sessions} students={students} loading={false} />)
    const legend = screen.getByTestId('quran-progress-chart-legend')
    expect(legend).toHaveTextContent('Aisha')
    expect(legend).toHaveTextContent('Yusuf')
  })

  it('renders a summary stat of total sessions and learner count', () => {
    const sessions = [
      makeSession('a1', '2026-05-10', 'child_001'),
      makeSession('a2', '2026-05-12', 'child_001'),
      makeSession('y1', '2026-05-18', 'child_002'),
    ]
    render(<QuranProgressChart sessions={sessions} students={students} loading={false} />)
    const summary = screen.getByTestId('quran-progress-chart-summary')
    expect(summary).toHaveTextContent('3 sessions')
    expect(summary).toHaveTextContent('2 learners')
  })
})
