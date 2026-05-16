/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPage, parseSettingsTab } from '@/features/settings/front/pages/SettingsPage'
import type { HouseholdContextType } from '@/features/household/front/context/HouseholdContext'

let mockSearchParams = new URLSearchParams()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

jest.mock('@/features/household/front/services/api', () => ({
  householdApi: {
    getProfile: jest.fn(() => Promise.resolve({ data: null })),
    updateProfile: jest.fn(),
    getProfile: jest.fn(() => Promise.resolve({ data: null })),
  },
}))

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getChildren: jest.fn(() => Promise.resolve({ data: [] })),
    createChild: jest.fn(),
    updateChild: jest.fn(),
    archiveChild: jest.fn(),
    restoreChild: jest.fn(),
  },
}))

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: {
    getSubjects: jest.fn(() => Promise.resolve({ data: [] })),
    createSubject: jest.fn(),
    archiveSubject: jest.fn(),
  },
}))

jest.mock('@/features/school-year/front/services/api', () => ({
  schoolYearApi: {
    getActiveSchoolYear: jest.fn(() => Promise.resolve({ data: null })),
  },
}))

const { useHousehold } = jest.requireMock('@/features/household/front/context') as {
  useHousehold: jest.MockedFunction<() => HouseholdContextType>
}
const { childrenApi } = jest.requireMock('@/features/children/front/services/api') as {
  childrenApi: {
    getChildren: jest.Mock
  }
}
const { schoolYearApi } = jest.requireMock('@/features/school-year/front/services/api') as {
  schoolYearApi: { getActiveSchoolYear: jest.Mock }
}

const mockWorkspace = {
  id: 'workspace_001',
  name: 'Test Academy',
  ownerId: 'user_001',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const loadedHousehold: HouseholdContextType = {
  workspace: mockWorkspace,
  householdProfile: {
    id: 'household_001',
    workspaceId: 'workspace_001',
    familyName: 'Test Family',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  familyName: 'Test Family',
  needsSetup: false,
  loading: false,
  error: null,
  refetch: jest.fn(),
}

describe('parseSettingsTab', () => {
  it('defaults invalid or missing tab to household', () => {
    expect(parseSettingsTab(null)).toBe('household')
    expect(parseSettingsTab('')).toBe('household')
    expect(parseSettingsTab('nope')).toBe('household')
  })

  it('accepts known tab ids', () => {
    expect(parseSettingsTab('school-year')).toBe('school-year')
    expect(parseSettingsTab('subjects')).toBe('subjects')
    expect(parseSettingsTab('children')).toBe('children')
  })
})

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    useHousehold.mockReturnValue(loadedHousehold)
  })

  it('shows loading when workspace is not yet available', () => {
    useHousehold.mockReturnValue({
      ...loadedHousehold,
      workspace: null,
    })
    render(<SettingsPage />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders tab list and household panel by default', () => {
    render(<SettingsPage />)
    expect(screen.getByTestId('settings-page')).toBeInTheDocument()
    expect(screen.getByTestId('settings-tab-household')).toBeInTheDocument()
    expect(screen.getByTestId('settings-tab-school-year')).toBeInTheDocument()
    expect(screen.getByTestId('settings-tab-children')).toBeInTheDocument()
    expect(screen.getByTestId('settings-tab-subjects')).toBeInTheDocument()
    expect(screen.getByTestId('settings-panel-household')).toBeInTheDocument()
  })

  it('navigates via router.replace when a tab is selected', async () => {
    render(<SettingsPage />)
    await userEvent.click(screen.getByTestId('settings-tab-school-year'))
    expect(mockReplace).toHaveBeenCalledWith('/settings?tab=school-year', { scroll: false })
  })

  it('shows school year panel when tab query is school-year', async () => {
    mockSearchParams = new URLSearchParams('tab=school-year')
    schoolYearApi.getActiveSchoolYear.mockResolvedValueOnce({
      data: {
        id: 'sy1',
        workspaceId: mockWorkspace.id,
        name: '2025–2026',
        startDate: '2025-08-01',
        endDate: '2026-05-31',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      status: 'success',
      message: 'ok',
      timestamp: '',
    })
    render(<SettingsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('settings-panel-school-year')).toBeInTheDocument()
    })
    expect(await screen.findByText(/Active school year/i)).toBeInTheDocument()
    expect(screen.getByText(/2025–2026/)).toBeInTheDocument()
  })

  it('subjects tab lists a shortcut per child when one child exists', async () => {
    mockSearchParams = new URLSearchParams('tab=subjects')
    childrenApi.getChildren.mockResolvedValueOnce({
      data: [
        {
          id: 'c1',
          householdId: mockWorkspace.id,
          name: 'Only',
          gradeLabel: '1',
          username: 'a',
          password: 'p',
          isActive: true,
          createdAt: '2026-01-01',
        },
      ],
      status: 'success',
      message: 'ok',
      timestamp: '',
    })
    render(<SettingsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('settings-subject-child-c1')).toBeInTheDocument()
    })
  })

  it('subjects tab lists a button per child when multiple children exist', async () => {
    mockSearchParams = new URLSearchParams('tab=subjects')
    childrenApi.getChildren.mockResolvedValueOnce({
      data: [
        {
          id: 'c1',
          householdId: mockWorkspace.id,
          name: 'Ada',
          gradeLabel: '1',
          username: 'a',
          password: 'p',
          isActive: true,
          createdAt: '2026-01-01',
        },
        {
          id: 'c2',
          householdId: mockWorkspace.id,
          name: 'Ben',
          gradeLabel: '2',
          username: 'b',
          password: 'p',
          isActive: true,
          createdAt: '2026-01-01',
        },
      ],
      status: 'success',
      message: 'ok',
      timestamp: '',
    })
    render(<SettingsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('settings-subject-child-c1')).toBeInTheDocument()
    })
    expect(screen.getByTestId('settings-subject-child-c2')).toBeInTheDocument()
  })
})
