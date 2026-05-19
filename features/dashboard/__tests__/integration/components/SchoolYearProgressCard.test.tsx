import { render, screen, waitFor } from '@testing-library/react'
import { SchoolYearProgressCard } from '@/features/dashboard/front/components/SchoolYearProgressCard'

const mockSchoolYear = {
  id: 'sy_001',
  workspaceId: 'ws_001',
  name: '2025–2026',
  startDate: '2025-08-01',
  endDate: '2026-05-31',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('SchoolYearProgressCard', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', data: mockSchoolYear }),
    })
  })

  it('renders school year progress after fetch', async () => {
    render(<SchoolYearProgressCard />)
    await waitFor(() => {
      expect(screen.getByTestId('school-year-progress-card')).toBeInTheDocument()
    })
    expect(screen.getByText(/days left/i)).toBeInTheDocument()
    expect(screen.getByText(/weeks/i)).toBeInTheDocument()
    expect(screen.getByText('2025–2026')).toBeInTheDocument()
  })

  it('renders a pacing indicator', async () => {
    render(<SchoolYearProgressCard />)
    await waitFor(() => {
      expect(screen.getByTestId('school-year-progress-card')).toBeInTheDocument()
    })
    const pacingLabels = ['On Pace', 'Behind', 'Ahead']
    const found = pacingLabels.some(label => screen.queryByText(label))
    expect(found).toBe(true)
  })

  it('renders nothing when fetch returns null', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', data: null }),
    })
    const { container } = render(<SchoolYearProgressCard />)
    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })
})
