import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { PortfolioPage } from '@/features/portfolio/front/pages/PortfolioPage'
import type { EvidenceItem } from '@/features/portfolio/types'

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(() => ({
    workspace: { id: 'ws_001', name: 'Test', ownerId: 'u', createdAt: '2026-01-01T00:00:00.000Z' },
    householdProfile: { id: 'hh_001', workspaceId: 'ws_001', familyName: 'Test', createdAt: '2026-01-01T00:00:00.000Z' },
    loading: false,
    needsSetup: false,
    familyName: 'Test',
  })),
}))

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getChildren: jest.fn(() =>
      Promise.resolve({
        data: [
          { id: 'c1', name: 'Khadijah', householdId: 'hh_001', gradeLabel: 'Grade 3', username: 'k', password: '', isActive: true, avatarInitials: 'K', createdAt: '2026-01-01T00:00:00.000Z' },
        ],
        status: 'success',
        message: '',
        timestamp: '',
      })
    ),
  },
}))

jest.mock('@/features/portfolio/front/services/api', () => ({
  portfolioApi: {
    listEvidence: jest.fn(() => Promise.resolve({ data: [], status: 'success', message: '', timestamp: '' })),
    createEvidence: jest.fn(),
    updateEvidence: jest.fn(),
  },
}))

global.fetch = jest.fn(() =>
  Promise.resolve({ ok: true, json: async () => ({ data: [], status: 'success', message: '', timestamp: '' }) })
) as jest.Mock

function makeEvidenceItem(overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return {
    id: 'ev_001',
    title: 'My Evidence',
    childId: 'c1',
    subjectId: 'sub_001',
    date: '2026-05-12',
    type: 'note',
    notes: 'Sample notes',
    createdBy: 'demo-parent',
    createdAt: '2026-05-12T00:00:00Z',
    updatedAt: '2026-05-12T00:00:00Z',
    ...overrides,
  }
}

describe('PortfolioPage — standalone (no DashboardProvider)', () => {
  test('renders without DashboardProvider', () => {
    expect(() => render(<PortfolioPage />)).not.toThrow()
  })

  test('shows Portfolio heading', async () => {
    render(<PortfolioPage />)
    await waitFor(() => expect(screen.getByRole('heading', { name: /portfolio/i })).toBeInTheDocument())
  })

  test('shows empty evidence state when no items exist', async () => {
    render(<PortfolioPage />)
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(), { timeout: 2000 })
    expect(screen.getByRole('heading', { name: /portfolio/i })).toBeInTheDocument()
  })
})

describe('PortfolioPage — evidence card edit (Phase 5)', () => {
  const { portfolioApi } = require('@/features/portfolio/front/services/api')

  beforeEach(() => {
    jest.clearAllMocks()
    portfolioApi.listEvidence.mockResolvedValue({
      data: [makeEvidenceItem()],
      status: 'success',
      message: '',
      timestamp: '',
    })
  })

  test('clicking an evidence card changes form heading to Edit Evidence', async () => {
    render(<PortfolioPage />)
    await waitFor(() => expect(screen.getByText('My Evidence')).toBeInTheDocument())
    fireEvent.click(screen.getByText('My Evidence'))
    await waitFor(() => expect(screen.getByText(/edit evidence/i)).toBeInTheDocument())
  })

  test('form shows Cancel edit button when editing', async () => {
    render(<PortfolioPage />)
    await waitFor(() => expect(screen.getByText('My Evidence')).toBeInTheDocument())
    fireEvent.click(screen.getByText('My Evidence'))
    await waitFor(() => expect(screen.getByRole('button', { name: /cancel edit/i })).toBeInTheDocument())
  })

  test('Cancel edit returns form to Add Evidence state', async () => {
    render(<PortfolioPage />)
    await waitFor(() => expect(screen.getByText('My Evidence')).toBeInTheDocument())
    fireEvent.click(screen.getByText('My Evidence'))
    await waitFor(() => expect(screen.getByRole('button', { name: /cancel edit/i })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /cancel edit/i }))
    await waitFor(() => expect(screen.getByText(/add evidence/i)).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /cancel edit/i })).not.toBeInTheDocument()
  })
})
