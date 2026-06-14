import React from 'react'
import { render, screen } from '@testing-library/react'

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(() => ({
    studentProfiles: [],
    loading: false,
    householdProfile: null,
    allSubjects: [],
    familyName: '',
    needsSetup: false,
    error: null,
    refetch: jest.fn(),
  })),
}))

jest.mock('@/features/records/front/services/api', () => ({
  reportsApi: { getRecordsReport: jest.fn() },
}))

jest.mock('@/features/quran/front/services/api', () => ({
  quranApi: { getSessions: jest.fn() },
}))

import { RecordsProof } from '@/features/dashboard/front/components/RecordsProof'
import { QuranStreak } from '@/features/dashboard/front/components/QuranStreak'
import { AlertItem } from '@/features/dashboard/front/components/shared/AlertItem'
import type { DashboardRecord, QuranSession } from '@/features/dashboard/front/types'
import type { StudentProfile } from '@/features/lib/types'
import type { Alert } from '@/features/alerts/types'

const CHILD_ID = 'student_seed_layth_001'

const mockRecords: DashboardRecord[] = [
  { id: 'record_attendance', title: 'Attendance', count: 16, maxCount: 20, icon: 'CheckCircle', viewButton: 'View records' },
  { id: 'record_progress',   title: 'Progress Updates', count: 12, icon: 'TrendingUp',   viewButton: 'View lessons' },
  { id: 'record_quran',      title: 'Quran Sessions',  count: 10, icon: 'BookOpen',      viewButton: 'View sessions' },
  { id: 'record_portfolio',  title: 'Portfolio Items', count: 8,  icon: 'Folder',        viewButton: 'View portfolio' },
]

const mockChildren: StudentProfile[] = [
  { id: CHILD_ID, householdId: 'hh_001', name: 'Layth', gradeLabel: '5th', isActive: true, username: 'layth', password: 'pw', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'child_002',  householdId: 'hh_001', name: 'Hawa',  gradeLabel: '3rd', isActive: true, username: 'hawa',  password: 'pw', createdAt: '2026-01-01T00:00:00Z' },
]

const mockSessions: QuranSession[] = []
const mockAddSession = jest.fn()

// ---- RecordsProof ----

describe('RecordsProof — linked filter hrefs', () => {
  it('uses plain paths when selectedChildId is null', () => {
    render(<RecordsProof records={mockRecords} selectedChildId={null} />)
    const attendanceLink = screen.getByRole('link', { name: /view records/i })
    expect(attendanceLink).toHaveAttribute('href', '/attendance')
  })

  it('appends childId to Attendance link', () => {
    render(<RecordsProof records={mockRecords} selectedChildId={CHILD_ID} />)
    const attendanceLink = screen.getByRole('link', { name: /view records/i })
    expect(attendanceLink).toHaveAttribute('href', `/attendance?childId=${CHILD_ID}`)
  })

  it('uses /lessons (not /planner) for progress updates link', () => {
    render(<RecordsProof records={mockRecords} selectedChildId={null} />)
    const progressLink = screen.getByRole('link', { name: /view lessons/i })
    expect(progressLink).toHaveAttribute('href', '/lessons')
  })

  it('appends childId to Lessons link', () => {
    render(<RecordsProof records={mockRecords} selectedChildId={CHILD_ID} />)
    const progressLink = screen.getByRole('link', { name: /view lessons/i })
    expect(progressLink).toHaveAttribute('href', `/lessons?childId=${CHILD_ID}`)
  })

  it('appends childId to Quran link', () => {
    render(<RecordsProof records={mockRecords} selectedChildId={CHILD_ID} />)
    const quranLink = screen.getByRole('link', { name: /view sessions/i })
    expect(quranLink).toHaveAttribute('href', `/quran?childId=${CHILD_ID}`)
  })
})

// ---- QuranStreak ----

describe('QuranStreak — child circles link to /quran?childId', () => {
  it('renders child name circles as links to child-scoped quran route', () => {
    render(
      <QuranStreak
        quranSessions={mockSessions}
        children={mockChildren}
        selectedChildId={null}
        onAddSession={mockAddSession}
      />
    )
    const laythLink = screen.getByRole('link', { name: /layth/i })
    expect(laythLink).toHaveAttribute('href', `/quran?childId=${CHILD_ID}`)
  })

  it('renders each child circle as a separate link', () => {
    render(
      <QuranStreak
        quranSessions={mockSessions}
        children={mockChildren}
        selectedChildId={null}
        onAddSession={mockAddSession}
      />
    )
    const laythLink = screen.getByRole('link', { name: /layth/i })
    const hawaLink  = screen.getByRole('link', { name: /hawa/i })
    expect(laythLink).toHaveAttribute('href', `/quran?childId=${CHILD_ID}`)
    expect(hawaLink).toHaveAttribute('href', `/quran?childId=child_002`)
  })

  it('Log Quran Session is still a button (not a link)', () => {
    render(
      <QuranStreak
        quranSessions={mockSessions}
        children={mockChildren}
        selectedChildId={null}
        onAddSession={mockAddSession}
      />
    )
    expect(screen.getByRole('button', { name: /log quran session/i })).toBeInTheDocument()
  })

  it('in selectedChild mode, only the selected child circle is shown as a link', () => {
    render(
      <QuranStreak
        quranSessions={mockSessions}
        children={mockChildren}
        selectedChildId={CHILD_ID}
        onAddSession={mockAddSession}
      />
    )
    const laythLink = screen.getByRole('link', { name: /layth/i })
    expect(laythLink).toHaveAttribute('href', `/quran?childId=${CHILD_ID}`)
    expect(screen.queryByRole('link', { name: /hawa/i })).not.toBeInTheDocument()
  })
})

// ---- AlertItem ----

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'alert_001',
    childId: null,
    type: 'missing_attendance',
    status: 'open',
    severity: 'medium',
    title: 'Missing attendance',
    message: 'Attendance not recorded for today',
    sourceFeature: 'attendance',
    createdAt: '2026-05-17T00:00:00Z',
    ...overrides,
  }
}

describe('AlertItem — linked hrefs', () => {
  it('renders as a link when alert.href is set', () => {
    const alert = makeAlert({ href: `/attendance?childId=${CHILD_ID}`, childId: CHILD_ID, childName: 'Layth' })
    render(<AlertItem alert={alert} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', `/attendance?childId=${CHILD_ID}`)
  })

  it('does not render a link when alert.href is absent', () => {
    const alert = makeAlert({ href: undefined })
    render(<AlertItem alert={alert} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('child-specific alert includes childId in href', () => {
    const alert = makeAlert({
      childId: CHILD_ID,
      childName: 'Layth',
      href: `/attendance?childId=${CHILD_ID}`,
    })
    render(<AlertItem alert={alert} />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toContain(`childId=${CHILD_ID}`)
  })

  it('household-level alert (childId null) renders plain href without childId', () => {
    const alert = makeAlert({ childId: null, href: '/attendance' })
    render(<AlertItem alert={alert} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/attendance')
    expect(link.getAttribute('href')).not.toContain('childId')
  })

  it('renders child name label when childName is provided', () => {
    const alert = makeAlert({ childId: CHILD_ID, childName: 'Layth', href: `/attendance?childId=${CHILD_ID}` })
    render(<AlertItem alert={alert} />)
    expect(screen.getByText('Layth')).toBeInTheDocument()
  })

  it('renders alert title and message', () => {
    const alert = makeAlert({ title: 'Low attendance', message: 'Below 80%', href: '/attendance' })
    render(<AlertItem alert={alert} />)
    expect(screen.getByText('Low attendance')).toBeInTheDocument()
    expect(screen.getByText('Below 80%')).toBeInTheDocument()
  })
})
