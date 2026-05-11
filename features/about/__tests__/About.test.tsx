import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { HouseholdProvider } from '@/features/household/front/context'
import { AboutPage } from '@/features/about/front/pages/About'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
  signOut: jest.fn(),
}))

// Pages in app/(public) sit outside HouseholdProvider by default —
// this test suite verifies that About is correctly wrapped so the
// household name reaches the Header. Regression guard: if the wrapper
// is removed, the context will throw and these tests will fail.
jest.mock('@/features/household/front/services/api', () => ({
  householdApi: {
    getWorkspace: jest.fn(() =>
      Promise.resolve({
        data: { id: 'ws_001', name: 'Ahmed Household', ownerId: 'user_001', createdAt: '2026-01-01T00:00:00.000Z' },
      })
    ),
    getProfile: jest.fn(() =>
      Promise.resolve({
        data: { id: 'hp_001', workspaceId: 'ws_001', familyName: 'Ahmed Academy', createdAt: '2026-01-01T00:00:00.000Z' },
      })
    ),
    setup: jest.fn(),
    updateProfile: jest.fn(),
  },
}))

function renderAbout() {
  return render(
    <HouseholdProvider>
      <AboutPage />
    </HouseholdProvider>
  )
}

describe('About page', () => {
  test('renders without crashing inside HouseholdProvider', () => {
    renderAbout()
    expect(screen.getByText(/Built for this family/i)).toBeInTheDocument()
  })

  test('shows household name in header once loaded', async () => {
    renderAbout()
    await waitFor(() => {
      expect(screen.getByText('Ahmed Academy')).toBeInTheDocument()
    })
  })

  test('falls back to "Home Education" when no household is set up', async () => {
    const { householdApi } = require('@/features/household/front/services/api')
    householdApi.getWorkspace.mockResolvedValueOnce({ data: null })
    householdApi.getProfile.mockResolvedValueOnce({ data: null })

    renderAbout()
    await waitFor(() => {
      expect(screen.getByText('Home Education')).toBeInTheDocument()
    })
  })
})
