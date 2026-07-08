import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { NeedsAttention } from '@/features/dashboard/front/components/NeedsAttention'
import type { Alert } from '@/features/alerts/types'

const TODAY = '2026-05-17'
const YESTERDAY = '2026-05-16'
const TWO_DAYS_AGO = '2026-05-15'

const highAlert: Alert = {
  id: 'alert_high',
  childId: 'adam_01',
  date: YESTERDAY,
  type: 'pending_lessons',
  status: 'open',
  severity: 'high',
  title: 'High severity alert',
  message: '2 overdue lessons',
  sourceFeature: 'planner',
  createdAt: `${YESTERDAY}T10:00:00Z`,
}

const mediumAlert: Alert = {
  id: 'alert_medium',
  childId: 'khadijah_01',
  date: TODAY,
  type: 'attendance_missing',
  status: 'open',
  severity: 'medium',
  title: 'Medium severity alert',
  message: 'Attendance not logged today',
  sourceFeature: 'attendance',
  createdAt: `${TODAY}T08:00:00Z`,
}

const lowAlert: Alert = {
  id: 'alert_low',
  childId: null,
  date: TWO_DAYS_AGO,
  type: 'pending_lessons',
  status: 'open',
  severity: 'low',
  title: 'Low severity alert',
  message: 'Lesson due today',
  sourceFeature: 'planner',
  createdAt: `${TWO_DAYS_AGO}T09:00:00Z`,
}

describe('NeedsAttention', () => {
  describe('empty state', () => {
    it('renders the heading when no alerts', () => {
      render(<NeedsAttention alerts={[]} />)
      expect(screen.getByText(/attention hub/i)).toBeInTheDocument()
    })

    it('renders a "0 open" pill when there are no alerts', () => {
      render(<NeedsAttention alerts={[]} />)
      expect(screen.getByText('0 open')).toBeInTheDocument()
    })

    it('renders nothing in the list area when alerts is empty', () => {
      const { container } = render(<NeedsAttention alerts={[]} />)
      // No AlertItem divs should appear (the space-y-2 div will be empty)
      const alertItems = container.querySelectorAll('[data-testid="alert-item"]')
      expect(alertItems).toHaveLength(0)
    })
  })

  describe('priority sort', () => {
    it('orders high severity before medium before low by default', () => {
      // Render with low then high order to confirm sort works
      render(<NeedsAttention alerts={[lowAlert, mediumAlert, highAlert]} />)

      const items = screen.getAllByRole('heading', { level: 3 })
      expect(items[0]).toHaveTextContent('High severity alert')
      expect(items[1]).toHaveTextContent('Medium severity alert')
      expect(items[2]).toHaveTextContent('Low severity alert')
    })

    it('re-sorts to priority when "By Priority" is selected', () => {
      render(<NeedsAttention alerts={[lowAlert, highAlert, mediumAlert]} />)

      // Select "By Priority" explicitly
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'priority' } })

      const items = screen.getAllByRole('heading', { level: 3 })
      expect(items[0]).toHaveTextContent('High severity alert')
      expect(items[1]).toHaveTextContent('Medium severity alert')
      expect(items[2]).toHaveTextContent('Low severity alert')
    })
  })

  describe('date sort', () => {
    it('sorts most recent date first when "By Date" is selected', () => {
      render(<NeedsAttention alerts={[lowAlert, highAlert, mediumAlert]} />)

      // Switch to date sort
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'date' } })

      const items = screen.getAllByRole('heading', { level: 3 })
      // TODAY > YESTERDAY > TWO_DAYS_AGO
      expect(items[0]).toHaveTextContent('Medium severity alert') // TODAY
      expect(items[1]).toHaveTextContent('High severity alert')   // YESTERDAY
      expect(items[2]).toHaveTextContent('Low severity alert')    // TWO_DAYS_AGO
    })

    it('falls back to createdAt when date field is absent', () => {
      const alertNoDate: Alert = {
        ...highAlert,
        id: 'alert_nodate',
        date: undefined,
        title: 'No date alert',
        createdAt: `${TWO_DAYS_AGO}T06:00:00Z`,
      }
      const alertWithDate: Alert = {
        ...mediumAlert,
        id: 'alert_withdate',
        date: TODAY,
        title: 'With date alert',
        createdAt: `${TWO_DAYS_AGO}T06:00:00Z`,
      }

      render(<NeedsAttention alerts={[alertNoDate, alertWithDate]} />)
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'date' } })

      const items = screen.getAllByRole('heading', { level: 3 })
      // alertWithDate has date=TODAY which is more recent than createdAt=TWO_DAYS_AGO
      expect(items[0]).toHaveTextContent('With date alert')
      expect(items[1]).toHaveTextContent('No date alert')
    })
  })

  describe('alert rendering', () => {
    it('displays alert message text', () => {
      render(<NeedsAttention alerts={[highAlert]} />)
      expect(screen.getByText('2 overdue lessons')).toBeInTheDocument()
    })

    it('shows a "N open" pill counting the alerts', () => {
      render(<NeedsAttention alerts={[highAlert, mediumAlert, lowAlert]} />)
      expect(screen.getByText('3 open')).toBeInTheDocument()
    })

    it('shows a "from <Source>" label for each alert, source name bold', () => {
      render(<NeedsAttention alerts={[highAlert, mediumAlert]} />)
      expect(screen.getByText('Planbook')).toBeInTheDocument()
      expect(screen.getByText('Attendance')).toBeInTheDocument()
    })

    it('shows "Household" as the learner chip for household-scoped alerts', () => {
      render(<NeedsAttention alerts={[lowAlert]} />)
      expect(screen.getByText('Household')).toBeInTheDocument()
    })

    it('is wrapped in a card matching the other Zone A card', () => {
      render(<NeedsAttention alerts={[highAlert]} />)
      expect(screen.getByTestId('attention-hub-card')).toHaveClass('bg-white', 'rounded-xl', 'border')
    })

    it('caps the visible list height and scrolls past 5 alerts instead of growing unbounded', () => {
      const many: Alert[] = Array.from({ length: 8 }, (_, i) => ({
        ...highAlert,
        id: `alert_${i}`,
        title: `Alert ${i}`,
      }))
      render(<NeedsAttention alerts={many} />)
      expect(screen.getAllByTestId('alert-item')).toHaveLength(8)
      expect(screen.getByTestId('attention-hub-list')).toHaveClass('overflow-y-auto')
    })

    it('applies red border for high severity', () => {
      const { container } = render(<NeedsAttention alerts={[highAlert]} />)
      const alertDiv = container.querySelector('.border-l-red-400')
      expect(alertDiv).not.toBeNull()
    })

    it('applies amber border for medium severity', () => {
      const { container } = render(<NeedsAttention alerts={[mediumAlert]} />)
      const alertDiv = container.querySelector('.border-l-amber-400')
      expect(alertDiv).not.toBeNull()
    })

    it('applies gray border for low severity', () => {
      const { container } = render(<NeedsAttention alerts={[lowAlert]} />)
      const alertDiv = container.querySelector('.border-l-slate-300')
      expect(alertDiv).not.toBeNull()
    })
  })
})
