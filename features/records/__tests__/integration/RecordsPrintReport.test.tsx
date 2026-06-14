import React from 'react'
import { render, screen } from '@testing-library/react'
import { RecordsPrintReport } from '@/features/records/front/components/RecordsPrintReport'
import type { RecordsReport } from '@/features/records/types'

const baseReport: RecordsReport = {
  child: {
    id: 'child_a',
    householdId: 'hh_001',
    name: 'Adam',
    gradeLabel: 'Grade 5',
    username: 'adam',
    password: 'password',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  dateRange: { start: '2025-08-01', end: '2026-05-31' },
  subjects: [],
  attendance: {
    childId: 'child_a',
    totalRecorded: 0,
    byStatus: {
      present: 0,
      absent: 0,
      partial: 0,
      excused: 0,
      sick: 0,
      holiday: 0,
      field_trip: 0,
      coop: 0,
      makeup: 0,
      not_school: 0,
    },
  },
  completedLessons: [],
  progressBySubject: [],
  portfolio: { count: 0, items: [] },
  timeBySubject: [],
  checklist: [],
  generatedAt: '2026-05-16T00:00:00Z',
}

describe('RecordsPrintReport — Time spent by subject', () => {
  it('renders the "Time spent by subject" section with aggregated minutes', () => {
    const report: RecordsReport = {
      ...baseReport,
      timeBySubject: [
        { subjectId: 'sub_a', subjectName: 'Mathematics', totalMinutes: 135 },
        { subjectId: null, subjectName: 'Unassigned', totalMinutes: 15 },
      ],
    }
    render(<RecordsPrintReport report={report} variant="full" />)

    expect(screen.getByText('Time spent by subject')).toBeInTheDocument()
    expect(screen.getByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByText('2h 15m')).toBeInTheDocument()
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
    expect(screen.getByText('15m')).toBeInTheDocument()
  })

  it('shows the empty-state message when timeBySubject is empty', () => {
    render(<RecordsPrintReport report={baseReport} variant="full" />)

    expect(screen.getByText('Time spent by subject')).toBeInTheDocument()
    expect(screen.getByText('No learning time recorded for this date range.')).toBeInTheDocument()
  })

  it('renders the section for the "progress" variant', () => {
    const report: RecordsReport = {
      ...baseReport,
      timeBySubject: [
        { subjectId: 'sub_a', subjectName: 'Mathematics', totalMinutes: 60 },
      ],
    }
    render(<RecordsPrintReport report={report} variant="progress" />)

    expect(screen.getByText('Time spent by subject')).toBeInTheDocument()
    expect(screen.getByText('1h 0m')).toBeInTheDocument()
  })

  it('does not render the section for the "attendance" variant', () => {
    render(<RecordsPrintReport report={baseReport} variant="attendance" />)

    expect(screen.queryByText('Time spent by subject')).not.toBeInTheDocument()
  })
})
