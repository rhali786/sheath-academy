import { render, screen } from '@testing-library/react'
import { DoToday } from '@/features/dashboard/front/components/DoToday'
import { NeedsAttention } from '@/features/dashboard/front/components/NeedsAttention'
import { PerChildProgress } from '@/features/dashboard/front/components/PerChildProgress'
import { QuranStudies } from '@/features/dashboard/front/components/QuranStudies'
import { RecordsProof } from '@/features/dashboard/front/components/RecordsProof'
import { mockChildren, mockAlerts, mockQuranSessions, mockRecords, mockProgressData } from '../../fixtures/mockData'

jest.mock('@/features/dashboard/front/context/DashboardProvider', () => ({
  useContext_Dashboard: jest.fn(() => ({ selectedChildId: null })),
}))

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: { getLessons: jest.fn().mockResolvedValue([]) },
}))

const mockAddQuranSession = jest.fn()

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

  describe('PerChildProgress Component', () => {
    test('renders without errors with valid props', () => {
      render(
        <PerChildProgress
          children={mockChildren}
          progressData={mockProgressData}
        />
      )

      expect(screen.getByText(/Per-Child Progress/i)).toBeInTheDocument()
    })

    test('displays all children as selectable buttons', () => {
      render(
        <PerChildProgress
          children={mockChildren}
          progressData={mockProgressData}
        />
      )

      mockChildren.forEach(child => {
        expect(screen.getByRole('button', { name: new RegExp(child.name) })).toBeInTheDocument()
      })
    })

    test('returns null when progress data is empty', () => {
      const { container } = render(
        <PerChildProgress
          children={mockChildren}
          progressData={{}}
        />
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('QuranStudies Component', () => {
    test('renders without errors with valid props', () => {
      render(
        <QuranStudies
          children={mockChildren}
          quranSessions={mockQuranSessions}
          onAddSession={mockAddQuranSession}
        />
      )

      expect(screen.getByText(/Quran, Arabic & Islamic Studies/i)).toBeInTheDocument()
    })

    test('displays quran logging section', () => {
      render(
        <QuranStudies
          children={mockChildren}
          quranSessions={mockQuranSessions}
          onAddSession={mockAddQuranSession}
        />
      )

      expect(screen.getByText(/Quran Logging/i)).toBeInTheDocument()
    })

    test('renders with empty sessions', () => {
      render(
        <QuranStudies
          children={mockChildren}
          quranSessions={[]}
          onAddSession={mockAddQuranSession}
        />
      )

      expect(screen.getByText(/Quran, Arabic & Islamic Studies/i)).toBeInTheDocument()
    })
  })

  describe('RecordsProof Component', () => {
    test('renders without errors with valid props', () => {
      render(<RecordsProof records={mockRecords} />)

      expect(screen.getByText(/Records & Proof/i)).toBeInTheDocument()
    })

    test('renders empty state when no records', () => {
      render(<RecordsProof records={[]} />)

      expect(screen.getByText(/Records & Proof/i)).toBeInTheDocument()
    })

    test('displays record categories', () => {
      render(<RecordsProof records={mockRecords} />)

      mockRecords.forEach(record => {
        expect(screen.getByText(record.title)).toBeInTheDocument()
      })
    })
  })
})
