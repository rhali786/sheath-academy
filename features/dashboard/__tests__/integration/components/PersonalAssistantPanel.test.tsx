import { render, screen } from '@testing-library/react'
import { PersonalAssistantPanel } from '@/features/dashboard/front/components/PersonalAssistantPanel'

describe('PersonalAssistantPanel', () => {
  test('renders beta badge and healthy fallback insight', () => {
    render(<PersonalAssistantPanel />)
    expect(screen.getByTestId('personal-assistant-panel')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('No major schedule risks')).toBeInTheDocument()
  })

  test('checklist links point to existing routes', () => {
    render(<PersonalAssistantPanel />)
    expect(screen.getByRole('link', { name: /reschedule lessons/i })).toHaveAttribute('href', '/plan')
    expect(screen.getByRole('link', { name: /add enrichment/i })).toHaveAttribute('href', '/lessons')
    expect(screen.getByRole('link', { name: /check compliance/i })).toHaveAttribute('href', '/settings?tab=records-compliance')
  })

  test('review suggestions links to /plan', () => {
    render(<PersonalAssistantPanel />)
    expect(screen.getByTestId('personal-assistant-review')).toHaveAttribute('href', '/plan')
  })

  test('renders a passed insight and uses its destination', () => {
    render(
      <PersonalAssistantPanel
        insight={{
          title: 'Overdue lessons need attention',
          message: '2 lessons are overdue for the selected child.',
          href: '/plan',
          source: 'planner',
        }}
      />,
    )

    expect(screen.getByText('Overdue lessons need attention')).toBeInTheDocument()
    expect(screen.getByText(/2 lessons are overdue/i)).toBeInTheDocument()
    expect(screen.getByTestId('personal-assistant-review')).toHaveAttribute('href', '/plan')
  })
})
