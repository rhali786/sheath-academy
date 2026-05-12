/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { ChildSelector } from '@/features/dashboard/front/components/ChildSelector'
import {
  DashboardContext,
  type DashboardContextType,
} from '@/features/dashboard/front/context'
import type { StudentProfile } from '@/features/lib/types'

const baseCtx = (): DashboardContextType => ({
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
})

function renderWith(ctx: Partial<DashboardContextType>) {
  return render(
    <DashboardContext.Provider value={{ ...baseCtx(), ...ctx }}>
      <ChildSelector />
    </DashboardContext.Provider>
  )
}

const twoKids: StudentProfile[] = [
  {
    id: 'c1',
    householdId: 'h1',
    name: 'A',
    gradeLabel: '1',
    username: 'a',
    password: 'p',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'c2',
    householdId: 'h1',
    name: 'B',
    gradeLabel: '2',
    username: 'b',
    password: 'p',
    isActive: true,
    createdAt: '2026-01-01',
  },
]

describe('ChildSelector', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('does not render when children array is empty', () => {
    renderWith({ children: [] })
    expect(screen.queryByTestId('child-selector')).not.toBeInTheDocument()
  })

  it('does not render when children array has exactly one child', () => {
    renderWith({ children: [twoKids[0]] })
    expect(screen.queryByTestId('child-selector')).not.toBeInTheDocument()
  })

  it('renders dropdown when children array has two or more children', () => {
    renderWith({ children: twoKids })
    expect(screen.getByTestId('child-selector')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('defaults to "All children" option', () => {
    renderWith({ children: twoKids })
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('')
  })

  it('selecting a child updates sessionStorage key sheath.selectedChildId', () => {
    const setSelectedChildId = jest.fn()
    renderWith({ children: twoKids, setSelectedChildId })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'c1' } })
    expect(setSelectedChildId).toHaveBeenCalledWith('c1')
  })

  it('selecting "All children" clears selection', () => {
    const setSelectedChildId = jest.fn()
    renderWith({ children: twoKids, selectedChildId: 'c1', setSelectedChildId })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } })
    expect(setSelectedChildId).toHaveBeenCalledWith(null)
  })
})
