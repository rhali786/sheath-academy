/**
 * Integration tests for HouseholdSetup — multi-card setup experience (F8).
 *
 * Tests render HouseholdSetup directly with mocked context and fetch.
 * They do NOT render AppShell or any full provider tree.
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HouseholdSetup } from '@/features/household/front/components/HouseholdSetup'
import { SetupCard } from '@/features/household/front/components/SetupCard'
import { SetupCard_Lessons } from '@/features/household/front/components/SetupCard_Lessons'
import { SetupCard_Portfolio } from '@/features/household/front/components/SetupCard_Portfolio'

// ── Context mock ──────────────────────────────────────────────────────────────
jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

// ── householdApi mock ─────────────────────────────────────────────────────────
jest.mock('@/features/household/front/services/api', () => ({
  householdApi: {
    setup: jest.fn(),
    getWorkspace: jest.fn(),
    getProfile: jest.fn(),
  },
}))

// ── childrenApi mock (used by SetupCard_Children) ─────────────────────────────
jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    createChild: jest.fn(),
  },
}))

// ── next/navigation mock ──────────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => '/'),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────
import type { HouseholdContextType } from '@/features/household/front/context/HouseholdContext'

const { useHousehold } = jest.requireMock('@/features/household/front/context') as {
  useHousehold: jest.MockedFunction<() => HouseholdContextType>
}

const mockWorkspace = {
  id: 'workspace_001',
  name: 'Test Academy',
  ownerId: 'user_001',
  createdAt: '2026-01-01T00:00:00.000Z',
}
const mockProfile = {
  id: 'household_001',
  workspaceId: 'workspace_001',
  familyName: 'Test Family',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const baseHouseholdExists: HouseholdContextType = {
  workspace: mockWorkspace,
  householdProfile: mockProfile,
  familyName: 'Test Family',
  needsSetup: false,
  loading: false,
  error: null,
  refetch: jest.fn(),
}

const noHousehold: HouseholdContextType = {
  workspace: null,
  householdProfile: null,
  familyName: '',
  needsSetup: true,
  loading: false,
  error: null,
  refetch: jest.fn(),
}

/** Build a fetch mock where each key is a URL substring and its value is the response data. */
function mockFetch(responses: Record<string, unknown>) {
  global.fetch = jest.fn((input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
    for (const [pattern, data] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(data),
        } as Response)
      }
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ status: 'success', data: null, message: 'ok', timestamp: '' }),
    } as Response)
  }) as jest.Mock
}

const emptyChildren = { status: 'success', data: [], message: 'ok', timestamp: '' }
const oneActiveChild = { status: 'success', data: [{ id: 'c1', name: 'Adam', isActive: true }], message: 'ok', timestamp: '' }
const activeSchoolYear = { status: 'success', data: { id: 'sy1', isActive: true, name: '2025-2026' }, message: 'ok', timestamp: '' }
const noActiveSchoolYear = { status: 'success', data: null, message: 'no active', timestamp: '' }
const emptySubjects = { status: 'success', data: [], message: 'ok', timestamp: '' }
const oneActiveSubject = { status: 'success', data: [{ id: 's1', isActive: true }], message: 'ok', timestamp: '' }

beforeEach(() => {
  jest.clearAllMocks()
})

// ── Household name card (existing behaviour) ──────────────────────────────────

describe('household name card', () => {
  it('shows household name card when no household exists', () => {
    useHousehold.mockReturnValue(noHousehold)
    render(<HouseholdSetup />)
    expect(screen.getByText('Welcome to Sheath Academy')).toBeInTheDocument()
  })

  it('does not show setup cards when no household exists', async () => {
    useHousehold.mockReturnValue(noHousehold)
    render(<HouseholdSetup />)
    expect(screen.queryByTestId('setup-card-children')).not.toBeInTheDocument()
    expect(screen.queryByTestId('setup-card-school-year')).not.toBeInTheDocument()
  })
})

// ── SetupCard_Children ────────────────────────────────────────────────────────

describe('SetupCard_Children', () => {
  it('shows SetupCard_Children when household exists and no active children', async () => {
    useHousehold.mockReturnValue(baseHouseholdExists)
    mockFetch({
      '/api/children/children': emptyChildren,
      '/api/school-years/active': activeSchoolYear,
      '/api/subjects': emptySubjects,
    })
    render(<HouseholdSetup />)
    await waitFor(() => {
      expect(screen.getByTestId('setup-card-children')).toBeInTheDocument()
    })
  })

  it('hides SetupCard_Children when at least one active child exists', async () => {
    useHousehold.mockReturnValue(baseHouseholdExists)
    mockFetch({
      '/api/children/children': oneActiveChild,
      '/api/school-years/active': activeSchoolYear,
      '/api/subjects': oneActiveSubject,
    })
    const onComplete = jest.fn()
    render(<HouseholdSetup onComplete={onComplete} />)
    await waitFor(() => {
      expect(screen.queryByTestId('setup-card-children')).not.toBeInTheDocument()
    })
  })
})

// ── SetupCard_Subjects ────────────────────────────────────────────────────────

describe('SetupCard_Subjects', () => {
  it('shows SetupCard_Subjects when children exist but subjects count is 0', async () => {
    useHousehold.mockReturnValue(baseHouseholdExists)
    mockFetch({
      '/api/children/children': oneActiveChild,
      '/api/school-years/active': activeSchoolYear,
      '/api/subjects': emptySubjects,
    })
    render(<HouseholdSetup />)
    await waitFor(() => {
      expect(screen.getByTestId('setup-card-subjects')).toBeInTheDocument()
    })
  })

  it('hides SetupCard_Subjects when at least one active subject exists', async () => {
    useHousehold.mockReturnValue(baseHouseholdExists)
    mockFetch({
      '/api/children/children': oneActiveChild,
      '/api/school-years/active': activeSchoolYear,
      '/api/subjects': oneActiveSubject,
    })
    const onComplete = jest.fn()
    render(<HouseholdSetup onComplete={onComplete} />)
    await waitFor(() => {
      expect(screen.queryByTestId('setup-card-subjects')).not.toBeInTheDocument()
    })
  })

  it('does not show SetupCard_Subjects when children do not exist', async () => {
    useHousehold.mockReturnValue(baseHouseholdExists)
    mockFetch({
      '/api/children/children': emptyChildren,
      '/api/school-years/active': activeSchoolYear,
      '/api/subjects': emptySubjects,
    })
    render(<HouseholdSetup />)
    await waitFor(() => {
      expect(screen.getByTestId('setup-card-children')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('setup-card-subjects')).not.toBeInTheDocument()
  })
})

// ── SetupCard_SchoolYear ──────────────────────────────────────────────────────

describe('SetupCard_SchoolYear', () => {
  it('shows SetupCard_SchoolYear when no active school year', async () => {
    useHousehold.mockReturnValue(baseHouseholdExists)
    mockFetch({
      '/api/children/children': emptyChildren,
      '/api/school-years/active': noActiveSchoolYear,
      '/api/subjects': emptySubjects,
    })
    render(<HouseholdSetup />)
    await waitFor(() => {
      expect(screen.getByTestId('setup-card-school-year')).toBeInTheDocument()
    })
  })

  it('hides SetupCard_SchoolYear when an active school year exists', async () => {
    useHousehold.mockReturnValue(baseHouseholdExists)
    mockFetch({
      '/api/children/children': emptyChildren,
      '/api/school-years/active': activeSchoolYear,
      '/api/subjects': emptySubjects,
    })
    render(<HouseholdSetup />)
    await waitFor(() => {
      expect(screen.queryByTestId('setup-card-school-year')).not.toBeInTheDocument()
    })
  })
})

// ── Stub cards ────────────────────────────────────────────────────────────────

describe('stub cards', () => {
  it('shows SetupCard_Lessons stub when children exist', async () => {
    useHousehold.mockReturnValue(baseHouseholdExists)
    mockFetch({
      '/api/children/children': oneActiveChild,
      '/api/school-years/active': activeSchoolYear,
      '/api/subjects': emptySubjects,
    })
    render(<HouseholdSetup />)
    await waitFor(() => {
      expect(screen.getByTestId('setup-card-lessons')).toBeInTheDocument()
    })
  })

  it('shows SetupCard_Portfolio stub when children exist', async () => {
    useHousehold.mockReturnValue(baseHouseholdExists)
    mockFetch({
      '/api/children/children': oneActiveChild,
      '/api/school-years/active': activeSchoolYear,
      '/api/subjects': emptySubjects,
    })
    render(<HouseholdSetup />)
    await waitFor(() => {
      expect(screen.getByTestId('setup-card-portfolio')).toBeInTheDocument()
    })
  })

  it('does not show stub cards when no children exist', async () => {
    useHousehold.mockReturnValue(baseHouseholdExists)
    mockFetch({
      '/api/children/children': emptyChildren,
      '/api/school-years/active': activeSchoolYear,
      '/api/subjects': emptySubjects,
    })
    render(<HouseholdSetup />)
    await waitFor(() => {
      expect(screen.getByTestId('setup-card-children')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('setup-card-lessons')).not.toBeInTheDocument()
    expect(screen.queryByTestId('setup-card-portfolio')).not.toBeInTheDocument()
  })

  it('disabled stub cards show tooltip copy "Coming soon"', () => {
    render(
      <SetupCard
        title="Create your first lesson plan"
        description="Stub"
        actionLabel="Set up lessons"
        disabled
        disabledTooltip="Coming soon"
      />
    )
    expect(screen.getByTitle('Coming soon')).toBeInTheDocument()
  })
})

// ── SetupCard shared component ────────────────────────────────────────────────

describe('SetupCard component', () => {
  it('renders title, description, and action button', () => {
    const onAction = jest.fn()
    render(
      <SetupCard
        title="Add your first child"
        description="Create profiles for each child in your household."
        actionLabel="Add child"
        onAction={onAction}
      />
    )
    expect(screen.getByText('Add your first child')).toBeInTheDocument()
    expect(screen.getByText('Create profiles for each child in your household.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add child' })).toBeInTheDocument()
  })

  it('calls onAction when button is clicked', async () => {
    const onAction = jest.fn()
    render(
      <SetupCard
        title="Test card"
        description="Test description"
        actionLabel="Click me"
        onAction={onAction}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Click me' }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('disabled button is not clickable', async () => {
    const onAction = jest.fn()
    render(
      <SetupCard
        title="Lessons"
        description="Coming soon"
        actionLabel="Set up"
        disabled
        disabledTooltip="Coming soon"
        onAction={onAction}
      />
    )
    const btn = screen.getByRole('button', { name: 'Set up' })
    expect(btn).toBeDisabled()
  })
})

// ── SetupCard_Lessons and _Portfolio standalone ───────────────────────────────

describe('SetupCard_Lessons standalone', () => {
  it('renders with a disabled action button', () => {
    render(<SetupCard_Lessons />)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  it('shows "Coming soon" tooltip text', () => {
    render(<SetupCard_Lessons />)
    expect(screen.getByTitle('Coming soon')).toBeInTheDocument()
  })
})

describe('SetupCard_Portfolio standalone', () => {
  it('renders with a disabled action button', () => {
    render(<SetupCard_Portfolio />)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  it('shows "Coming soon" tooltip text', () => {
    render(<SetupCard_Portfolio />)
    expect(screen.getByTitle('Coming soon')).toBeInTheDocument()
  })
})

// ── Setup completion ──────────────────────────────────────────────────────────

describe('setup completion', () => {
  it('calls onComplete when all required steps are satisfied', async () => {
    useHousehold.mockReturnValue(baseHouseholdExists)
    mockFetch({
      '/api/children/children': oneActiveChild,
      '/api/school-years/active': activeSchoolYear,
      '/api/subjects': oneActiveSubject,
    })
    const onComplete = jest.fn()
    render(<HouseholdSetup onComplete={onComplete} />)
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    })
  })
})
