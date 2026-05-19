import { render, screen } from '@testing-library/react'
import { TodayStatusSummary } from '@/features/dashboard/front/components/TodayStatusSummary'
import { mockMetrics } from '../../fixtures/mockData'

describe('TodayStatusSummary', () => {
  it('renders null when metrics is null', () => {
    const { container } = render(<TodayStatusSummary metrics={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders readiness percentage', () => {
    render(<TodayStatusSummary metrics={mockMetrics} />)
    expect(screen.getByTestId('today-status-summary')).toBeInTheDocument()
    expect(screen.getByText(/daily readiness/i)).toBeInTheDocument()
    expect(screen.getByText(/%/)).toBeInTheDocument()
  })

  it('renders attendance status pill', () => {
    render(<TodayStatusSummary metrics={mockMetrics} />)
    expect(screen.getByText(/attendance/i)).toBeInTheDocument()
    expect(screen.getByText('4/4')).toBeInTheDocument()
  })

  it('renders quran status pill', () => {
    render(<TodayStatusSummary metrics={mockMetrics} />)
    expect(screen.getByText(/quran/i)).toBeInTheDocument()
  })

  it('shows "Not yet" when no quran logged today', () => {
    const noQuran = { ...mockMetrics, quranLogged: 'None today' }
    render(<TodayStatusSummary metrics={noQuran} />)
    expect(screen.getByText(/not yet/i)).toBeInTheDocument()
  })

  it('renders needs attention count', () => {
    render(<TodayStatusSummary metrics={mockMetrics} />)
    expect(screen.getByText(/needs attention/i)).toBeInTheDocument()
  })
})
