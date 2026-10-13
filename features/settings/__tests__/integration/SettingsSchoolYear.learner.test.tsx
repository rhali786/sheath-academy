/**
 * @jest-environment jsdom
 *
 * UAT 5.2 — a learner opens Settings → School year.
 *
 * What Amir saw on dev: "No active school year yet. Create one below." (the household
 * HAS one — the learner just isn't allowed to read it), then, after filling in the
 * form and saving, "Something went wrong. Please try again." instead of the policy's
 * "Learners are not allowed to make this change."
 *
 * The real `schoolYearApi` runs here; only `fetch` is stubbed, and it answers with
 * the exact bodies `learnerDenials.contract.test.ts` pins to the real learner policy.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { SettingsPage } from '@/features/settings/front/pages/SettingsPage'
import { SchoolYearForm } from '@/features/school-year/front/components/SchoolYearForm'
import { LearnerProvider } from '@/features/layout/front/context/LearnerContext'
import type { HouseholdContextType } from '@/features/household/front/context/HouseholdContext'
import {
  LEARNER_READ_DENIED,
  LEARNER_WRITE_DENIED,
  fakeResponse,
} from '@/features/school-year/__tests__/fixtures/learnerDenials'

const mockSearchParams = new URLSearchParams('tab=school-year')

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => mockSearchParams,
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { name: 'ZZ UAT Probe', email: 'learner.probe@no-email.local' } },
    update: jest.fn(),
  })),
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

jest.mock('@/features/household/front/services/api', () => ({
  householdApi: {
    getProfile: jest.fn(() => Promise.resolve({ data: null })),
    updateProfile: jest.fn(),
    updateUserProfile: jest.fn(),
  },
}))

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: { getChildren: jest.fn(() => Promise.resolve({ data: [] })) },
}))

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: { getSubjects: jest.fn(() => Promise.resolve({ data: [] })) },
}))

const { useHousehold } = jest.requireMock('@/features/household/front/context') as {
  useHousehold: jest.MockedFunction<() => HouseholdContextType>
}

const household: HouseholdContextType = {
  householdProfile: {
    id: 'household_001',
    workspaceId: 'household_001',
    familyName: 'Barakah Academy',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  studentProfiles: [],
  allSubjects: [],
  familyName: 'Barakah Academy',
  needsSetup: false,
  loading: false,
  error: null,
  refetch: jest.fn(),
}

/** Every school-year request goes through this, answered as the learner policy does. */
const calls: string[] = []
function learnerFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(String(input))
  const key = `${init?.method ?? 'GET'} ${url.pathname}`
  calls.push(key)
  if (key.startsWith('GET /api/school-years')) return Promise.resolve(fakeResponse(LEARNER_READ_DENIED))
  if (url.pathname.startsWith('/api/school-years')) return Promise.resolve(fakeResponse(LEARNER_WRITE_DENIED))
  return Promise.resolve(fakeResponse({ status: 404, body: { status: 'error', data: null, message: 'unexpected' } }))
}

beforeEach(() => {
  calls.length = 0
  global.fetch = jest.fn(learnerFetch) as unknown as typeof fetch
  useHousehold.mockImplementation(() => household)
})

function renderSettings() {
  return render(
    <LearnerProvider>
      <SettingsPage />
    </LearnerProvider>,
  )
}

describe('UAT 5.2 — learner on Settings → School year', () => {
  it('loads the tab by asking for the active school year', async () => {
    renderSettings()
    await waitFor(() => expect(calls).toContain('GET /api/school-years/active'))
  })

  it('shows the access refusal, not "No active school year yet"', async () => {
    renderSettings()
    expect(await screen.findByText(LEARNER_READ_DENIED.body.message)).toBeInTheDocument()
    expect(screen.queryByText(/no active school year yet/i)).not.toBeInTheDocument()
  })

  it('does not offer to create a school year it could not read', async () => {
    renderSettings()
    await screen.findByText(LEARNER_READ_DENIED.body.message)
    expect(screen.queryByLabelText(/school year name/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument()
    expect(calls.filter(c => c.startsWith('POST'))).toEqual([])
  })

  it('shows the read error (not the empty state) when loading fails for any other reason', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(fakeResponse({ status: 500, body: { status: 'error', data: null, message: 'Database unavailable' } })),
    ) as unknown as typeof fetch
    renderSettings()
    expect(await screen.findByText('Database unavailable')).toBeInTheDocument()
    expect(screen.queryByText(/no active school year yet/i)).not.toBeInTheDocument()
  })
})

describe('UAT 5.2 — saving the school year form when the server refuses', () => {
  it('shows "Learners are not allowed to make this change." instead of "Something went wrong"', async () => {
    const user = userEvent.setup()
    render(<SchoolYearForm embedded />)

    await user.type(screen.getByLabelText(/school year name/i), '2026–2027')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText(LEARNER_WRITE_DENIED.body.message)).toBeInTheDocument()
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument()
    expect(calls).toContain('POST /api/school-years')
  })

  it('re-enables the save button after a refusal so the user is not stuck', async () => {
    const user = userEvent.setup()
    render(<SchoolYearForm embedded />)
    await user.type(screen.getByLabelText(/school year name/i), '2026–2027')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await screen.findByText(LEARNER_WRITE_DENIED.body.message)
    expect(screen.getByRole('button', { name: /save/i })).toBeEnabled()
  })
})
