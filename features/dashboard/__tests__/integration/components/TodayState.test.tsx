import { render, screen } from '@testing-library/react'
import { TodayState } from '@/features/dashboard/front/components/TodayState'
import { mockMetrics } from '../../fixtures/mockData'

describe('TodayState Component', () => {
  test('renders null when metrics is null', () => {
    const { container } = render(<TodayState metrics={null} />)
    expect(container.firstChild).toBeNull()
  })

  test('displays all metric cards when metrics provided', () => {
    render(<TodayState metrics={mockMetrics} />)
    
    // Check that key metrics are displayed
    expect(screen.getByText(/attendance/i)).toBeInTheDocument()
    expect(screen.getByText('3/5')).toBeInTheDocument()
  })

  test('displays correct metric values', () => {
    render(<TodayState metrics={mockMetrics} />)

    // Check for all metric labels and values
    expect(screen.getByText(/lessons planned/i)).toBeInTheDocument()
    expect(screen.getByText(/need attention/i)).toBeInTheDocument()
    expect(screen.getByText(/quran logged/i)).toBeInTheDocument()
    expect(screen.getByText(/1 session/i)).toBeInTheDocument()
  })
})
