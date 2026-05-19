import React from 'react'
import { render, screen } from '@testing-library/react'
import { IslamicCalendarCard } from '@/features/islamic-calendar/front/components/IslamicCalendarCard'

describe('IslamicCalendarCard', () => {
  it('shows "begins in X days" for upcoming event', () => {
    render(<IslamicCalendarCard event="Ramadan" daysUntil={23} />)
    expect(screen.getByText(/Ramadan begins in 23 days/i)).toBeInTheDocument()
  })

  it('shows "today" language when daysUntil is 0', () => {
    render(<IslamicCalendarCard event="Ramadan" daysUntil={0} />)
    expect(screen.getByText(/today/i)).toBeInTheDocument()
  })

  it('shows "tomorrow" when daysUntil is 1', () => {
    render(<IslamicCalendarCard event="White Days" daysUntil={1} />)
    expect(screen.getByText(/tomorrow/i)).toBeInTheDocument()
  })

  it('renders nothing when enabled is false', () => {
    const { container } = render(<IslamicCalendarCard event="Ramadan" daysUntil={23} enabled={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders correctly when enabled is true (default)', () => {
    render(<IslamicCalendarCard event="Eid al-Fitr" daysUntil={10} enabled={true} />)
    expect(screen.getByText(/Eid al-Fitr/i)).toBeInTheDocument()
  })

  it('shows sacred month message when event is Sacred Month and daysUntil is 0', () => {
    render(<IslamicCalendarCard event="Sacred Month" daysUntil={0} description="We are in Rajab, one of the sacred months" />)
    // Both the heading and description may mention "sacred month" — verify at least one is present
    const matches = screen.getAllByText(/sacred month/i)
    expect(matches.length).toBeGreaterThan(0)
  })
})
