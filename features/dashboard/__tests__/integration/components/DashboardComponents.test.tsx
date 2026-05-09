/**
 * Comprehensive UI Component Integration Tests
 *
 * Tests each dashboard component in isolation to catch rendering errors,
 * prop mismatches, and missing dependencies.
 */

import { render, screen } from '@testing-library/react'
import { DoToday } from '@/features/dashboard/front/components/DoToday'
import { NeedsAttention } from '@/features/dashboard/front/components/NeedsAttention'
import { PerChildProgress } from '@/features/dashboard/front/components/PerChildProgress'
import { QuranStudies } from '@/features/dashboard/front/components/QuranStudies'
import { RecordsProof } from '@/features/dashboard/front/components/RecordsProof'
import { mockChildren, mockTasks, mockAlerts, mockQuranSessions, mockRecords, mockProgressData } from '../../fixtures/mockData'

const mockToggleTask = jest.fn()
const mockAddQuranSession = jest.fn()

describe('Dashboard Components - Unit Tests', () => {
  describe('DoToday Component', () => {
    test('renders without errors with valid props', () => {
      render(
        <DoToday
          tasks={mockTasks}
          children={mockChildren}
          onTaskToggle={mockToggleTask}
        />
      )

      expect(screen.getByText(/Do Today/i)).toBeInTheDocument()
    })

    test('displays all child names in task groups', () => {
      render(
        <DoToday
          tasks={mockTasks}
          children={mockChildren}
          onTaskToggle={mockToggleTask}
        />
      )

      mockChildren.forEach(child => {
        expect(screen.getByText(new RegExp(child.name))).toBeInTheDocument()
      })
    })

    test('renders empty state when no tasks', () => {
      render(
        <DoToday
          tasks={[]}
          children={mockChildren}
          onTaskToggle={mockToggleTask}
        />
      )

      expect(screen.getByText(/Do Today/i)).toBeInTheDocument()
    })

    test('displays task descriptions and subjects', () => {
      render(
        <DoToday
          tasks={mockTasks}
          children={mockChildren}
          onTaskToggle={mockToggleTask}
        />
      )

      mockTasks.forEach(task => {
        expect(screen.getByText(new RegExp(task.description))).toBeInTheDocument()
      })
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
        expect(screen.getByText(new RegExp(record.category))).toBeInTheDocument()
      })
    })
  })
})
