import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock router push for URL param updates
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

import { useSearchParams } from 'next/navigation'
import { useHousehold } from '@/features/household/front/context'
import { CalendarNav } from '@/features/schedule/front/components/CalendarNav'

const mockUseSearchParams = useSearchParams as jest.Mock
const mockUseHousehold = useHousehold as jest.Mock

const defaultHousehold = () => ({ allSubjects: [], householdProfile: null })

beforeEach(() => {
  mockUseHousehold.mockImplementation(defaultHousehold)
  mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-03-18'))
  mockPush.mockReset()
})

afterEach(() => {
  mockUseHousehold.mockImplementation(defaultHousehold)
})

describe('CalendarNav', () => {
  it('renders Day / Week / Month switcher buttons', () => {
    render(<CalendarNav />)
    expect(screen.getByRole('button', { name: /^day$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^week$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^month$/i })).toBeInTheDocument()
  })

  it('renders Previous, Next, and Today navigation buttons', () => {
    render(<CalendarNav />)
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument()
  })

  it('Day button is active when ?view= is absent (defaults to day)', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-03-18'))
    render(<CalendarNav />)
    const dayBtn = screen.getByRole('button', { name: /^day$/i })
    // Active day button has a visually distinct style — check aria-pressed or data-active
    expect(dayBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('Week button becomes active when ?view=week', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-03-18&view=week'))
    render(<CalendarNav />)
    expect(screen.getByRole('button', { name: /^week$/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^day$/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('Month button becomes active when ?view=month', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-03-18&view=month'))
    render(<CalendarNav />)
    expect(screen.getByRole('button', { name: /^month$/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('clicking Week button updates ?view=week in the URL', () => {
    render(<CalendarNav />)
    fireEvent.click(screen.getByRole('button', { name: /^week$/i }))
    expect(mockPush).toHaveBeenCalledTimes(1)
    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('view=week')
    expect(url).toContain('date=2026-03-18')
  })

  it('clicking Month button updates ?view=month in the URL', () => {
    render(<CalendarNav />)
    fireEvent.click(screen.getByRole('button', { name: /^month$/i }))
    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('view=month')
  })

  it('clicking Day button sets ?view=day in URL', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-03-18&view=week'))
    render(<CalendarNav />)
    fireEvent.click(screen.getByRole('button', { name: /^day$/i }))
    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('view=day')
  })

  it('Previous button in day mode navigates to previous day', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-03-18'))
    render(<CalendarNav />)
    fireEvent.click(screen.getByRole('button', { name: /previous/i }))
    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('date=2026-03-17')
  })

  it('Next button in day mode navigates to next day', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-03-18'))
    render(<CalendarNav />)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('date=2026-03-19')
  })

  it('Previous button in week mode navigates back 7 days', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-03-18&view=week'))
    render(<CalendarNav />)
    fireEvent.click(screen.getByRole('button', { name: /previous/i }))
    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('date=2026-03-11')
    expect(url).toContain('view=week')
  })

  it('Next button in week mode navigates forward 7 days', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-03-18&view=week'))
    render(<CalendarNav />)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('date=2026-03-25')
  })

  it('Today button navigates to today with the current view mode preserved', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-03-18&view=week'))
    render(<CalendarNav />)
    fireEvent.click(screen.getByRole('button', { name: /today/i }))
    const url = mockPush.mock.calls[0][0] as string
    expect(url).toContain('view=week')
    // date should be today (dynamic — just check it's a valid date string)
    expect(url).toMatch(/date=\d{4}-\d{2}-\d{2}/)
  })
})
