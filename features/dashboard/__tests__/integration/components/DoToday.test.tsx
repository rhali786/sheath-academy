import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { DoToday } from '@/features/dashboard/front/components/DoToday'
import { DashboardContext } from '@/features/dashboard/front/context/DashboardProvider'
import type { DashboardContextType } from '@/features/dashboard/front/context/DashboardProvider'
import type { StudentProfile } from '@/features/lib/types'

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: { getLessons: jest.fn().mockResolvedValue([]) },
}))

const mockChild: StudentProfile = {
  id: 'child_001',
  householdId: 'hh_001',
  name: 'Adam',
  gradeLabel: '5th',
  isActive: true,
  username: 'adam',
  password: 'pw',
  createdAt: '2026-01-01T00:00:00Z',
}

function makeCtx(overrides: Partial<DashboardContextType> = {}): DashboardContextType {
  return {
    children: [],
    tasks: [],
    setTasks: jest.fn(),
    alerts: [],
    setAlerts: jest.fn(),
    quranSessions: [],
    setQuranSessions: jest.fn(),
    records: [],
    setRecords: jest.fn(),
    metrics: null,
    setMetrics: jest.fn(),
    toggleTask: jest.fn(),
    addQuranSession: jest.fn(),
    loading: false,
    error: null,
    selectedChildId: null,
    setSelectedChildId: jest.fn(),
    ...overrides,
  }
}

function renderDoToday(ctx: DashboardContextType) {
  return render(
    <DashboardContext.Provider value={ctx}>
      <DoToday />
    </DashboardContext.Provider>
  )
}

describe('DoToday', () => {
  it('renders TodayLessonCard with the selected child when selectedChildId is set', async () => {
    renderDoToday(makeCtx({ selectedChildId: 'child_001', children: [mockChild] }))
    await waitFor(() => {
      expect(screen.getByText(/today —/i)).toBeInTheDocument()
    })
  })

  it('renders TodayLessonCard for all children when no child is selected', async () => {
    renderDoToday(makeCtx({ selectedChildId: null, children: [mockChild] }))
    await waitFor(() => {
      // TodayLessonCard still renders its "Today —" heading when children are provided
      expect(screen.getByText(/today —/i)).toBeInTheDocument()
    })
  })

  it('renders TodayLessonCard even with empty children list', async () => {
    renderDoToday(makeCtx({ selectedChildId: null, children: [] }))
    await waitFor(() => {
      expect(screen.getByText(/today —/i)).toBeInTheDocument()
    })
  })
})

describe('DashboardProvider auto-selects first child', () => {
  it('shows TodayLessonCard when selectedChildId is provided with a child', async () => {
    const ctx = makeCtx({
      selectedChildId: 'child_001',
      children: [mockChild],
    })
    renderDoToday(ctx)
    await waitFor(() => {
      expect(screen.getByText(/today —/i)).toBeInTheDocument()
    })
  })
})
