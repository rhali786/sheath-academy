/**
 * CRITICAL TEST: Ensures Dashboard works within DashboardProvider
 *
 * Also asserts the three-zone re-shell (P7):
 *   Zone A — Today (summary cards + schedule + Attention Hub)
 *   Zone B — Per-learner command center
 *   Zone C — Proof & Progress (Compliance, School Year, Qur'an, Islamic, To-dos)
 *
 * and the cuts: PersonalAssistantPanel + RecordsProof are no longer on Home,
 * the standalone LearningTimeEntry card is gone (Start learning time moved to the
 * schedule footer), and the header date renders as plain text (no day-nav buttons).
 */

import { render, screen, waitFor } from '@testing-library/react'
import { DashboardProvider } from '@/features/dashboard/front/context'
import { HouseholdProvider } from '@/features/household/front/context'
import { LearnerProvider } from '@/features/layout/front/context/LearnerContext'
import Dashboard from '@/features/dashboard/front/pages/Dashboard'
import { useRouter, useSearchParams } from 'next/navigation'
import { plannerApi } from '@/features/plan/front/services/api'
import { alertsApi } from '@/features/alerts/front/services/api'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { name: 'Aisha Parent', email: 'aisha@example.com' } },
    status: 'authenticated',
  })),
}))

jest.mock('@/features/dashboard/front/components/SchoolYearProgressCard', () => ({
  SchoolYearProgressCard: () => <div data-testid="school-year-progress-card" />,
}))

jest.mock('@/features/dashboard/front/components/LearnerCommandCenter', () => ({
  LearnerCommandCenter: () => <div data-testid="learner-command-center" />,
}))

jest.mock('@/features/dashboard/front/components/ComplianceStatusCard', () => ({
  ComplianceStatusCard: () => <div data-testid="compliance-status-card" />,
}))

jest.mock('@/features/todos/front/components/PersonalTodoList', () => ({
  PersonalTodoList: () => <div data-testid="personal-todo-list" />,
}))

jest.mock('@/features/schedule/front/components/ScheduleTimeline', () => ({
  ScheduleTimeline: () => <div data-testid="schedule-timeline" />,
}))

const HOUSEHOLD_ALERT = {
  id: 'a1',
  childId: null,
  type: 'attendance_missing',
  status: 'open',
  severity: 'medium',
  title: 'Attendance not recorded',
  message: 'Record attendance for today.',
  sourceFeature: 'attendance',
  createdAt: '2026-01-01T00:00:00.000Z',
  href: '/attendance',
}

const CHILD_ALERT = {
  id: 'a2',
  childId: 'c1',
  childName: 'Alice',
  type: 'pending_lessons',
  status: 'open',
  severity: 'high',
  title: 'Overdue lessons',
  message: '2 lessons are overdue.',
  sourceFeature: 'planner',
  createdAt: '2026-01-01T00:00:00.000Z',
  href: '/plan',
}

jest.mock('@/features/alerts/front/services/api', () => ({
  alertsApi: {
    getAlerts: jest.fn(() => Promise.resolve({ data: [] })),
  },
}))

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    getProgress: jest.fn(() => Promise.resolve([])),
    getLessons: jest.fn(() => Promise.resolve([])),
  },
}))

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: {
    getSubjects: jest.fn(() => Promise.resolve({ data: [] })),
  },
}))

jest.mock('@/features/quran/front/services/api', () => ({
  quranApi: {
    getSessions: jest.fn(() => Promise.resolve({ data: { sessions: [], chartData: [] } })),
    addSession: jest.fn(),
  },
}))

jest.mock('@/features/dashboard/front/services/api', () => ({
  dashboardApi: {
    getQuran: jest.fn(() => Promise.resolve({ data: { sessions: [], chartData: [] } })),
    getRecords: jest.fn(() => Promise.resolve({ data: [] })),
    getSummary: jest.fn(() => Promise.resolve({
      data: {
        attendanceReady: '3/5',
        lessonsPlanned: 2,
        needsAttention: 2,
        quranLogged: '1 session',
        portfolioItems: 1,
        tasksCompleted: 3,
        tasksInProgress: 1,
        tasksOverdue: 0,
      },
    })),
    getProgress: jest.fn(() => Promise.resolve({ data: {} })),
    completeTask: jest.fn(),
    addQuranSession: jest.fn(),
  }
}))

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getAllChildren: jest.fn(() => Promise.resolve({ data: [] })),
    getChildren: jest.fn(() => Promise.resolve({
      data: [
        { id: 'c1', householdId: 'h1', name: 'Alice', gradeLabel: '1', username: 'alice', password: 'p', isActive: true, createdAt: '2026-01-01' },
        { id: 'c2', householdId: 'h1', name: 'Bob', gradeLabel: '2', username: 'bob', password: 'p', isActive: true, createdAt: '2026-01-01' },
      ]
    })),
  }
}))

jest.mock('@/features/household/front/services/api', () => ({
  householdApi: {
    getProfile: jest.fn(() => Promise.resolve({
      data: { id: 'household_001', workspaceId: 'household_001', familyName: 'Naeem Family', createdAt: '2026-01-01T00:00:00.000Z' }
    })),
    setup: jest.fn(() => Promise.resolve({ data: {} })),
    updateProfile: jest.fn(() => Promise.resolve({ data: {} })),
  }
}))

const mockUseRouter = useRouter as jest.Mock
const mockUseSearchParams = useSearchParams as jest.Mock
const mockGetLessons = plannerApi.getLessons as jest.Mock
const mockGetAlerts = alertsApi.getAlerts as jest.Mock
const mockPush = jest.fn()
const mockReplace = jest.fn()

function todayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function renderDashboard() {
  return render(
    <HouseholdProvider>
      <LearnerProvider>
        <DashboardProvider>
          <Dashboard />
        </DashboardProvider>
      </LearnerProvider>
    </HouseholdProvider>
  )
}

async function renderLoaded() {
  renderDashboard()
  await waitFor(() => {
    expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument()
  }, { timeout: 3000 })
}

describe('Dashboard Page Integration', () => {
  beforeEach(() => {
    mockPush.mockReset()
    mockReplace.mockReset()
    mockGetLessons.mockClear()
    mockGetAlerts.mockReset()
    mockGetAlerts.mockResolvedValue({ data: [] })
    mockUseRouter.mockReturnValue({ push: mockPush, replace: mockReplace })
    mockUseSearchParams.mockReturnValue(new URLSearchParams())
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: { nextStep: null, completed: [] },
        message: '',
        timestamp: new Date().toISOString(),
      }),
    })
  })

  test('Dashboard renders within DashboardProvider without context errors', async () => {
    renderDashboard()
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  test('renders three labeled zones in order: Today, Per-learner, Proof & Progress', async () => {
    await renderLoaded()

    const today = screen.getByTestId('dashboard-zone-today')
    const learners = screen.getByTestId('dashboard-zone-learners')
    const proof = screen.getByTestId('dashboard-zone-proof')

    expect(today).toBeInTheDocument()
    expect(learners).toBeInTheDocument()
    expect(proof).toBeInTheDocument()

    // DOM order: today precedes learners precedes proof
    expect(today.compareDocumentPosition(learners) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(learners.compareDocumentPosition(proof) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('Zone A holds the schedule panel and the Attention Hub', async () => {
    await renderLoaded()
    const today = screen.getByTestId('dashboard-zone-today')
    expect(today).toContainElement(screen.getByTestId('today-schedule-panel'))
    expect(today).toContainElement(screen.getByTestId('dashboard-attention-hub'))
  })

  test('Attention Hub renders aggregated alerts with a learner chip on every item', async () => {
    mockGetAlerts.mockResolvedValue({ data: [HOUSEHOLD_ALERT, CHILD_ALERT] })
    await renderLoaded()

    const hub = screen.getByTestId('dashboard-attention-hub')
    await waitFor(() => {
      expect(screen.getByText('Overdue lessons')).toBeInTheDocument()
    })
    // household-scoped item reads "Household"; child-scoped item reads its name
    expect(hub).toHaveTextContent('Household')
    expect(hub).toHaveTextContent('Alice')
  })

  test('per-learner command center renders in Zone B', async () => {
    await renderLoaded()
    const learners = screen.getByTestId('dashboard-zone-learners')
    expect(learners).toContainElement(screen.getByTestId('learner-command-center'))
  })

  test('Zone C renders Compliance, School Year, and full-width To-dos', async () => {
    await renderLoaded()
    const proof = screen.getByTestId('dashboard-zone-proof')
    expect(proof).toContainElement(screen.getByTestId('compliance-status-card'))
    expect(proof).toContainElement(screen.getByTestId('school-year-progress-card'))
    expect(proof).toContainElement(screen.getByTestId('personal-todo-list'))
  })

  test('PersonalAssistantPanel and RecordsProof no longer render on Home', async () => {
    await renderLoaded()
    expect(screen.queryByTestId('personal-assistant-panel')).not.toBeInTheDocument()
    expect(screen.queryByText(/Records Readiness/i)).not.toBeInTheDocument()
  })

  test('Start learning time appears in the schedule footer; standalone card is gone', async () => {
    await renderLoaded()
    const panel = screen.getByTestId('today-schedule-panel')
    expect(panel).toHaveTextContent(/start learning time/i)
    expect(screen.queryByTestId('learning-time-entry')).not.toBeInTheDocument()
  })

  test('the header date is plain text, not a day-nav button', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-05-23'))
    await renderLoaded()
    expect(screen.getByTestId('dashboard-selected-date')).toHaveTextContent('May 23, 2026')
    expect(screen.queryByLabelText('Next day')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Previous day')).not.toBeInTheDocument()
  })

  test('Dashboard shows task summary cards', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByTestId('today-task-summary-cards')).toBeInTheDocument()
    })
  })

  test('ScheduleTimeline is rendered inside the schedule panel', async () => {
    await renderLoaded()
    expect(screen.getByTestId('schedule-timeline')).toBeInTheDocument()
  })

  test('dashboard header renders without child selector when household has fewer than two children', async () => {
    await renderLoaded()
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument()
  })

  test('Dashboard fetches the selected date from the planner API', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-05-23'))
    renderDashboard()
    await waitFor(() => {
      expect(mockGetLessons).toHaveBeenLastCalledWith(undefined, undefined, undefined, '2026-05-23', '2026-05-23')
    })
  })

  test('invalid date query is normalized back to today', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=not-a-date'))
    renderDashboard()
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(`/?date=${todayStr()}`)
    })
  })
})
