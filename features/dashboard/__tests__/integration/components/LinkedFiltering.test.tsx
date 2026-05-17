import React from 'react'
import { render, screen } from '@testing-library/react'
import { TodayState } from '@/features/dashboard/front/components/TodayState'
import { RecordsProof } from '@/features/dashboard/front/components/RecordsProof'
import { QuranStreak } from '@/features/dashboard/front/components/QuranStreak'
import type { DashboardMetrics, DashboardRecord, QuranSession } from '@/features/dashboard/front/types'
import type { StudentProfile } from '@/features/lib/types'

const CHILD_ID = 'student_seed_layth_001'

const mockMetrics: DashboardMetrics = {
  attendanceReady: '4/4',
  lessonsPlanned: 40,
  needsAttention: 3,
  quranLogged: '10 sessions',
  portfolioItems: 8,
}

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

// ---- TodayState ----

describe('TodayState — linked filter hrefs', () => {
  it('uses plain paths when selectedChildId is null (All Children)', () => {
    render(<TodayState metrics={mockMetrics} selectedChildId={null} />)
    const attendanceLink = screen.getByRole('link', { name: /attendance ready/i })
    expect(attendanceLink).toHaveAttribute('href', '/attendance')
  })

  it('appends childId to Attendance link when selectedChildId is provided', () => {
    render(<TodayState metrics={mockMetrics} selectedChildId={CHILD_ID} />)
    const attendanceLink = screen.getByRole('link', { name: /attendance ready/i })
    expect(attendanceLink).toHaveAttribute('href', `/attendance?childId=${CHILD_ID}`)
  })

  it('appends childId to Lessons Planned link', () => {
    render(<TodayState metrics={mockMetrics} selectedChildId={CHILD_ID} />)
    const links = screen.getAllByRole('link', { name: /lessons planned/i })
    expect(links[0]).toHaveAttribute('href', `/lessons?childId=${CHILD_ID}`)
  })

  it('appends childId to Quran Logged link', () => {
    render(<TodayState metrics={mockMetrics} selectedChildId={CHILD_ID} />)
    const quranLink = screen.getByRole('link', { name: /quran logged/i })
    expect(quranLink).toHaveAttribute('href', `/quran?childId=${CHILD_ID}`)
  })

  it('omits childId from all links when selectedChildId is undefined', () => {
    render(<TodayState metrics={mockMetrics} />)
    const attendanceLink = screen.getByRole('link', { name: /attendance ready/i })
    expect(attendanceLink).toHaveAttribute('href', '/attendance')
  })
})

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
