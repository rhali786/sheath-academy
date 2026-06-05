/**
 * Integration tests for MemberManager.
 * Covers: loading, populated members/invitations, invite form, revoke, remove.
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemberManager } from '@/features/household/front/components/MemberManager'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

import { useSession } from 'next-auth/react'
const mockUseSession = useSession as jest.Mock

const mockFetch = jest.fn()
global.fetch = mockFetch

const SESSION = {
  data: {
    user: {
      householdId: 'hh_a',
      userId: 'user_owner',
      email: 'owner@test.com',
      memberships: [
        { householdId: 'hh_a', householdName: 'Barakah Academy', role: 'owner' },
      ],
    },
  },
  status: 'authenticated',
}

const MEMBERS = [
  { memberId: 'hm_1', userId: 'user_owner', role: 'owner', email: 'owner@test.com', name: 'Rasheed Ali', createdAt: '2024-01-01' },
  { memberId: 'hm_2', userId: 'user_member', role: 'member', email: 'member@test.com', name: null, createdAt: '2024-01-02' },
]

const INVITATIONS = [
  { id: 'inv_1', email: 'pending@test.com', role: 'member', status: 'pending', expiresAt: new Date(Date.now() + 86400000).toISOString() },
]

function mockFetchResponses() {
  mockFetch.mockImplementation((url: string, options?: RequestInit) => {
    if (url.includes('/api/household/members') && (!options || options.method === 'GET' || !options.method)) {
      return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: { members: MEMBERS }, message: '', timestamp: '' }) })
    }
    if (url.includes('/api/household/invitations') && (!options || options.method === 'GET' || !options.method)) {
      return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: { invitations: INVITATIONS }, message: '', timestamp: '' }) })
    }
    if (url.includes('/api/household/invite') && options?.method === 'POST' && !url.includes('revoke') && !url.includes('accept')) {
      return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: { invitationId: 'inv_new' }, message: '', timestamp: '' }) })
    }
    if (url.includes('/api/household/invite/revoke') && options?.method === 'POST') {
      return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: {}, message: '', timestamp: '' }) })
    }
    if (url.includes('/api/household/member') && options?.method === 'DELETE') {
      return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: {}, message: '', timestamp: '' }) })
    }
    return Promise.resolve({ ok: false, json: async () => ({ status: 'error', message: 'Not found' }) })
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseSession.mockReturnValue(SESSION)
  mockFetchResponses()
})

describe('MemberManager', () => {
  it('shows a loading state initially', () => {
    render(<MemberManager />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders member names after loading', async () => {
    render(<MemberManager />)
    await waitFor(() => {
      expect(screen.getByText('Rasheed Ali')).toBeInTheDocument()
    })
    expect(screen.getByText('member@test.com')).toBeInTheDocument()
  })

  it('shows the owner badge on the owner row', async () => {
    render(<MemberManager />)
    await waitFor(() => {
      expect(screen.getByText('Rasheed Ali')).toBeInTheDocument()
    })
    expect(screen.getByText('owner')).toBeInTheDocument()
  })

  it('shows pending invitations', async () => {
    render(<MemberManager />)
    await waitFor(() => {
      expect(screen.getByText('pending@test.com')).toBeInTheDocument()
    })
  })

  it('renders an invite form with an email input', async () => {
    render(<MemberManager />)
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
    })
  })

  it('submits the invite form and refetches data', async () => {
    render(<MemberManager />)
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
    })
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'new@test.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send invite/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/household/invite'),
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })

  it('clicking Revoke calls the revoke API', async () => {
    render(<MemberManager />)
    await waitFor(() => {
      expect(screen.getByText('pending@test.com')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /revoke/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/household/invite/revoke'),
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })

  it('clicking Remove calls the member remove API', async () => {
    render(<MemberManager />)
    await waitFor(() => {
      expect(screen.getByText('member@test.com')).toBeInTheDocument()
    })
    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    fireEvent.click(removeButtons[0])

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/household/member'),
        expect.objectContaining({ method: 'DELETE' }),
      )
    })
  })

  it('does not show Remove button for the current user (owner)', async () => {
    render(<MemberManager />)
    await waitFor(() => {
      expect(screen.getByText('Rasheed Ali')).toBeInTheDocument()
    })
    // Only the non-owner member row should have a Remove button
    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    expect(removeButtons).toHaveLength(1)
  })

  it('shows teacher badge for members with teacher role', async () => {
    const MEMBERS_WITH_TEACHER = [
      ...MEMBERS,
      { memberId: 'hm_3', userId: 'user_teacher', role: 'teacher', email: 'teacher@test.com', name: 'Aisha Teacher', createdAt: '2024-01-03' },
    ]
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/api/household/members') && (!options || !options.method || options.method === 'GET')) {
        return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: { members: MEMBERS_WITH_TEACHER }, message: '', timestamp: '' }) })
      }
      if (url.includes('/api/household/invitations')) {
        return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: { invitations: [] }, message: '', timestamp: '' }) })
      }
      return Promise.resolve({ ok: false, json: async () => ({ status: 'error', message: 'Not found' }) })
    })
    render(<MemberManager />)
    await waitFor(() => {
      expect(screen.getByText('Aisha Teacher')).toBeInTheDocument()
    })
    expect(screen.getByText('teacher')).toBeInTheDocument()
  })

  it('invite form has a role selector and sends role in POST body', async () => {
    render(<MemberManager />)
    await waitFor(() => {
      expect(screen.getByTestId('invite-role-select')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByTestId('invite-role-select'), { target: { value: 'teacher' } })
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), { target: { value: 'new-teacher@test.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send invite/i }))

    await waitFor(() => {
      const call = mockFetch.mock.calls.find(c => c[0].includes('/api/household/invite') && c[1]?.method === 'POST')
      expect(call).toBeTruthy()
      const body = JSON.parse(call[1].body)
      expect(body.role).toBe('teacher')
    })
  })
})
