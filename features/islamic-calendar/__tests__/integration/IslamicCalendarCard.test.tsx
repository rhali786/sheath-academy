import React from 'react'
import { render, screen } from '@testing-library/react'
import { IslamicCalendarCard } from '@/features/islamic-calendar/front/components/IslamicCalendarCard'

describe('IslamicCalendarCard', () => {
  it('renders nothing when there are no events', () => {
    const { container } = render(<IslamicCalendarCard events={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a single card with the Islamic Calendar title, once, regardless of event count', () => {
    render(
      <IslamicCalendarCard
        events={[
          { id: 'a', event: 'Day of Arafah', daysUntil: 4 },
          { id: 'b', event: 'Eid al-Adha', daysUntil: 5 },
          { id: 'c', event: 'Islamic New Year', daysUntil: 24, description: '1 Muharram' },
        ]}
      />,
    )
    expect(screen.getAllByTestId('islamic-calendar-card')).toHaveLength(1)
    expect(screen.getAllByText('Islamic Calendar')).toHaveLength(1)
  })

  it('lists every event as its own row inside the one card', () => {
    render(
      <IslamicCalendarCard
        events={[
          { id: 'a', event: 'Day of Arafah', daysUntil: 4 },
          { id: 'b', event: 'Eid al-Adha', daysUntil: 5 },
        ]}
      />,
    )
    expect(screen.getByText('Day of Arafah')).toBeInTheDocument()
    expect(screen.getByText('Eid al-Adha')).toBeInTheDocument()
  })

  it('shows "today" / "tomorrow" / "in N days" per row', () => {
    render(
      <IslamicCalendarCard
        events={[
          { id: 'a', event: 'Sacred Month', daysUntil: 0 },
          { id: 'b', event: 'White Days', daysUntil: 1 },
          { id: 'c', event: 'Ramadan', daysUntil: 23 },
        ]}
      />,
    )
    expect(screen.getByText('today')).toBeInTheDocument()
    expect(screen.getByText('tomorrow')).toBeInTheDocument()
    expect(screen.getByText('in 23 days')).toBeInTheDocument()
  })

  it('shows the description as a subtitle when provided', () => {
    render(
      <IslamicCalendarCard
        events={[{ id: 'a', event: 'Islamic New Year', daysUntil: 24, description: '1 Muharram' }]}
      />,
    )
    expect(screen.getByText('1 Muharram')).toBeInTheDocument()
  })
})
