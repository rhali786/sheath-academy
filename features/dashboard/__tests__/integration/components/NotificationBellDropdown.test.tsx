import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NotificationBellDropdown } from '@/features/dashboard/front/components/NotificationBellDropdown'
import { mockAlerts } from '../../fixtures/mockData'
import { listConversations } from '@/features/messaging/front/services/api'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: null })),
}))

jest.mock('@/features/messaging/front/hooks/useUnreadMessages', () => ({
  useUnreadMessages: jest.fn(() => ({ count: 0 })),
}))

jest.mock('@/features/messaging/front/services/api', () => ({
  listConversations: jest.fn(),
}))

import { useSession } from 'next-auth/react'
import { useUnreadMessages } from '@/features/messaging/front/hooks/useUnreadMessages'

const mockUseSession = useSession as jest.Mock
const mockUseUnreadMessages = useUnreadMessages as jest.Mock
const mockListConversations = listConversations as jest.Mock

describe('NotificationBellDropdown', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: null })
    mockUseUnreadMessages.mockReturnValue({ count: 0 })
    mockListConversations.mockReset()
  })
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

  test('includes unread message count in the notification badge', () => {
    mockUseUnreadMessages.mockReturnValue({ count: 3 })
    render(<NotificationBellDropdown alerts={[]} />)
    expect(screen.getByTestId('notification-badge')).toHaveTextContent('3')
  })

  test('shows unread message notifications with links to the conversation', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { userId: 'user_a', email: 'a@example.com' } },
    })
    mockUseUnreadMessages.mockReturnValue({ count: 2 })
    mockListConversations.mockResolvedValue({
      data: {
        conversations: [
          {
            id: 'conv_1',
            type: 'direct',
            title: null,
            createdByUserId: 'user_b',
            lastMessageAt: '2026-06-09T12:00:00Z',
            settings: null,
            createdAt: '2026-06-01T00:00:00Z',
            updatedAt: '2026-06-09T12:00:00Z',
            unreadCount: 2,
            lastMessage: { body: 'Assalamu alaikum', senderUserId: 'user_b' },
            participants: [
              { userId: 'user_a', userName: 'Parent A', userEmail: 'a@example.com', role: 'member' },
              { userId: 'user_b', userName: 'Amina', userEmail: 'amina@gmail.com', role: 'member' },
            ],
          },
        ],
      },
    })

    render(<NotificationBellDropdown alerts={[]} />)

    await waitFor(() => {
      expect(mockListConversations).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByTestId('dashboard-notification-bell'))

    const messageItem = screen.getByRole('menuitem', { name: /2 new messages from Amina/i })
    expect(messageItem).toBeInTheDocument()
    expect(screen.getByText('Assalamu alaikum')).toBeInTheDocument()
    expect(messageItem).toHaveAttribute('href', '/messages?c=conv_1')
  })
})
