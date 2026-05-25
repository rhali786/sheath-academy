import { render, screen, fireEvent } from '@testing-library/react'
import { NotificationBellDropdown } from '@/features/dashboard/front/components/NotificationBellDropdown'
import { mockAlerts } from '../../fixtures/mockData'

describe('NotificationBellDropdown', () => {
  test('shows badge count for open alerts', () => {
    render(<NotificationBellDropdown alerts={mockAlerts} />)
    expect(screen.getByTestId('notification-badge')).toHaveTextContent('2')
  })

  test('opens dropdown with alert titles', () => {
    render(<NotificationBellDropdown alerts={mockAlerts} />)
    fireEvent.click(screen.getByTestId('dashboard-notification-bell'))
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument()
    expect(screen.getByText(mockAlerts[0].title)).toBeInTheDocument()
  })

  test('sorts open alerts by severity before date', () => {
    const alerts = [
      { ...mockAlerts[1], title: 'Medium alert', severity: 'medium' as const, createdAt: '2026-05-24T09:00:00Z' },
      { ...mockAlerts[0], title: 'High alert', severity: 'high' as const, createdAt: '2026-05-23T08:00:00Z' },
    ]

    render(<NotificationBellDropdown alerts={alerts} />)
    fireEvent.click(screen.getByTestId('dashboard-notification-bell'))

    const items = screen.getAllByRole('menuitem')
    expect(items[0]).toHaveTextContent('High alert')
    expect(items[1]).toHaveTextContent('Medium alert')
  })

  test('closes the dropdown after clicking an alert link', () => {
    render(<NotificationBellDropdown alerts={mockAlerts} />)
    fireEvent.click(screen.getByTestId('dashboard-notification-bell'))
    fireEvent.click(screen.getByRole('menuitem', { name: /3 lessons not completed/i }))
    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument()
  })

  test('shows empty state when no open alerts', () => {
    const dismissed = mockAlerts.map(a => ({ ...a, status: 'dismissed' as const }))
    render(<NotificationBellDropdown alerts={dismissed} />)
    fireEvent.click(screen.getByTestId('dashboard-notification-bell'))
    expect(screen.getByTestId('notification-empty')).toHaveTextContent('No new notifications')
  })
})
