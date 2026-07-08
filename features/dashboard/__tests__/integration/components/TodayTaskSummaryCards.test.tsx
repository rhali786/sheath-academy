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

  test('renders prototype copy: labels and hints', () => {
    render(<TodayTaskSummaryCards metrics={mockMetrics} totalLearners={3} />)
    expect(screen.getByTestId('task-summary-green')).toHaveTextContent('Lessons done')
    expect(screen.getByTestId('task-summary-green')).toHaveTextContent('Across 3 learners')
    expect(screen.getByTestId('task-summary-blue')).toHaveTextContent('In progress')
    expect(screen.getByTestId('task-summary-blue')).toHaveTextContent("On today's schedule")
    expect(screen.getByTestId('task-summary-orange')).toHaveTextContent('Overdue')
    expect(screen.getByTestId('task-summary-orange')).toHaveTextContent('Needs attention')
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
