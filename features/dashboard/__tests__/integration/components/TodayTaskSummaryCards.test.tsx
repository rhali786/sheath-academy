import { render, screen } from '@testing-library/react'
import { TodayTaskSummaryCards } from '@/features/dashboard/front/components/TodayTaskSummaryCards'
import { mockMetrics } from '../../fixtures/mockData'

describe('TodayTaskSummaryCards', () => {
  test('renders null when metrics is null', () => {
    const { container } = render(<TodayTaskSummaryCards metrics={null} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders three summary cards with counts', () => {
    render(<TodayTaskSummaryCards metrics={mockMetrics} />)
    expect(screen.getByTestId('today-task-summary-cards')).toBeInTheDocument()
    expect(screen.getByTestId('task-summary-green')).toHaveTextContent('8')
    expect(screen.getByTestId('task-summary-blue')).toHaveTextContent('1')
    expect(screen.getByTestId('task-summary-orange')).toHaveTextContent('2')
  })

  test('shows zero states', () => {
    render(
      <TodayTaskSummaryCards
        metrics={{
          ...mockMetrics,
          tasksCompleted: 0,
          tasksInProgress: 0,
          tasksOverdue: 0,
        }}
      />,
    )
    expect(screen.getByTestId('task-summary-green')).toHaveTextContent('0')
  })
})
