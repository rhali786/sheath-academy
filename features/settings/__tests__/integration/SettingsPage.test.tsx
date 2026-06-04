/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPage, parseSettingsTab } from '@/features/settings/front/pages/SettingsPage'
import type { HouseholdContextType } from '@/features/household/front/context/HouseholdContext'

let mockSearchParams = new URLSearchParams()
const mockReplace = jest.fn()
const mockUpdateSession = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { name: 'Test User', email: 'test@example.com' } },
    update: mockUpdateSession,
  })),
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

jest.mock('@/features/household/front/services/api', () => ({
  householdApi: {
    getProfile: jest.fn(() => Promise.resolve({ data: null })),
    updateProfile: jest.fn(),
    updateUserProfile: jest.fn(() => Promise.resolve({ status: 'success', data: { name: 'Test User' } })),
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
const { householdApi } = jest.requireMock('@/features/household/front/services/api') as {
  householdApi: { updateUserProfile: jest.Mock; updateProfile: jest.Mock; getProfile: jest.Mock }
}
import { useSession } from 'next-auth/react'
const mockUseSession = useSession as jest.Mock

const loadedHousehold: HouseholdContextType = {
  householdProfile: {
    id: 'household_001',
    workspaceId: 'household_001',
    familyName: 'Test Family',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  studentProfiles: [],
  allSubjects: [],
  familyName: 'Test Family',
  needsSetup: false,
  loading: false,
  error: null,
  refetch: jest.fn(),
}

describe('IslamicRemindersSection toggle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    useHousehold.mockReturnValue(loadedHousehold)
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('unchecking "Ramadan" persists the change to localStorage', async () => {
    render(<SettingsPage />)
    // Household tab is active by default and contains the IslamicRemindersSection
    const checkbox = screen.getByRole('checkbox', { name: /Ramadan/ })
    expect(checkbox).toBeChecked()

    await userEvent.click(checkbox)

    expect(checkbox).not.toBeChecked()
    const stored = JSON.parse(localStorage.getItem('islamicReminderSettings') ?? '{}')
    expect(stored['Ramadan']).toBe(false)
  })
})

describe('Wave 9 — SettingsPage tab restructure', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    useHousehold.mockReturnValue(loadedHousehold)
  })

  it('tab labels include "Learners", "Courses", "Planning Defaults", "Records & Compliance", "Access & Privacy"', () => {
    render(<SettingsPage />)
    expect(screen.getByRole('tab', { name: 'Learners' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Courses' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Planning Defaults' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Records & Compliance' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Access & Privacy' })).toBeInTheDocument()
  })

  it('does NOT show "Children" or "Subjects" as tab labels', () => {
    render(<SettingsPage />)
    const tabs = screen.getAllByRole('tab')
    const tabLabels = tabs.map(t => t.textContent)
    expect(tabLabels).not.toContain('Children')
    expect(tabLabels).not.toContain('Subjects')
  })
})

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

  it('shows loading when household profile is not yet available', () => {
    useHousehold.mockReturnValue({
      ...loadedHousehold,
      householdProfile: null,
      loading: true,
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
        workspaceId: 'household_001',
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
          householdId: 'household_001',
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
          householdId: 'household_001',
          name: 'Ada',
          gradeLabel: '1',
          username: 'a',
          password: 'p',
          isActive: true,
          createdAt: '2026-01-01',
        },
        {
          id: 'c2',
          householdId: 'household_001',
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

describe('Display name — Your profile section', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    useHousehold.mockReturnValue(loadedHousehold)
    mockUpdateSession.mockResolvedValue(undefined)
    householdApi.updateUserProfile.mockResolvedValue({ status: 'success', data: { name: 'Fatima Ali' } })
  })

  it('renders display name form in household tab', () => {
    render(<SettingsPage />)
    expect(screen.getByTestId('display-name-form')).toBeInTheDocument()
    expect(screen.getByTestId('display-name-input')).toBeInTheDocument()
  })

  it('pre-fills input with current session name', () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: 'Existing Name', email: 'test@example.com' } },
      update: mockUpdateSession,
    })
    render(<SettingsPage />)
    expect(screen.getByTestId('display-name-input')).toHaveValue('Existing Name')
  })

  it('pre-fills empty when session has no name', () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      update: mockUpdateSession,
    })
    render(<SettingsPage />)
    expect(screen.getByTestId('display-name-input')).toHaveValue('')
  })

  it('saves display name and shows success message', async () => {
    render(<SettingsPage />)
    const input = screen.getByTestId('display-name-input')
    await userEvent.clear(input)
    await userEvent.type(input, 'Fatima Ali')
    await userEvent.click(screen.getByTestId('display-name-save'))
    await waitFor(() => {
      expect(screen.getByTestId('display-name-success')).toBeInTheDocument()
    })
    expect(householdApi.updateUserProfile).toHaveBeenCalledWith({ name: 'Fatima Ali' })
    expect(mockUpdateSession).toHaveBeenCalledWith({ name: 'Fatima Ali' })
  })

  it('shows error message when save fails', async () => {
    householdApi.updateUserProfile.mockRejectedValue(new Error('Network error'))
    render(<SettingsPage />)
    const input = screen.getByTestId('display-name-input')
    await userEvent.clear(input)
    await userEvent.type(input, 'Fatima Ali')
    await userEvent.click(screen.getByTestId('display-name-save'))
    await waitFor(() => {
      expect(screen.getByText(/could not save/i)).toBeInTheDocument()
    })
  })
})
