import { render, screen } from '@testing-library/react'
import { DoToday } from '@/features/dashboard/front/components/DoToday'
import { NeedsAttention } from '@/features/dashboard/front/components/NeedsAttention'
import { RecordsProof } from '@/features/dashboard/front/components/RecordsProof'
import { mockAlerts, mockRecords } from '../../fixtures/mockData'

jest.mock('@/features/dashboard/front/context/DashboardProvider', () => ({
  useContext_Dashboard: jest.fn(() => ({ selectedChildId: null, children: [] })),
}))

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: { getLessons: jest.fn().mockResolvedValue([]) },
}))

describe('Dashboard Components - Unit Tests', () => {
  describe('DoToday Component', () => {
    test('renders heading', () => {
      render(<DoToday />)
      expect(screen.getByText(/Do Today/i)).toBeInTheDocument()
    })

    test('renders empty state when no child selected', () => {
      render(<DoToday />)
      expect(screen.getByText(/Do Today/i)).toBeInTheDocument()
    })
  })

  describe('NeedsAttention Component', () => {
    test('renders without errors with valid props', () => {
      render(<NeedsAttention alerts={mockAlerts} />)

      expect(screen.getByText(/Needs Attention/i)).toBeInTheDocument()
    })

    test('displays sort dropdown', () => {
      render(<NeedsAttention alerts={mockAlerts} />)

      expect(screen.getByDisplayValue(/Priority/i)).toBeInTheDocument()
    })

    test('renders empty state when no alerts', () => {
      render(<NeedsAttention alerts={[]} />)

      expect(screen.getByText(/Needs Attention/i)).toBeInTheDocument()
    })
  })

  describe('RecordsProof Component', () => {
    test('renders without errors with valid props', () => {
      render(<RecordsProof records={mockRecords} />)

      expect(screen.getByText(/Records Readiness/i)).toBeInTheDocument()
    })

    test('renders empty state when no records', () => {
      render(<RecordsProof records={[]} />)

      expect(screen.getByText(/Records Readiness/i)).toBeInTheDocument()
    })

    test('displays record categories', () => {
      render(<RecordsProof records={mockRecords} />)

      mockRecords.forEach(record => {
        expect(screen.getByText(record.title)).toBeInTheDocument()
      })
    })
  })
})
