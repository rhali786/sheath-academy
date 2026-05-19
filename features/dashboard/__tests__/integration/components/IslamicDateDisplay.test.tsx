import { render, screen } from '@testing-library/react'
import { IslamicDateDisplay } from '@/features/dashboard/front/components/IslamicDateDisplay'

describe('IslamicDateDisplay', () => {
  it('renders a Gregorian date', () => {
    render(<IslamicDateDisplay />)
    // Should contain the current year
    expect(screen.getByText(/2026/i)).toBeInTheDocument()
  })

  it('renders a Hijri date with AH suffix', () => {
    render(<IslamicDateDisplay />)
    expect(screen.getByText(/AH/)).toBeInTheDocument()
  })

  it('renders a Hijri month name', () => {
    render(<IslamicDateDisplay />)
    const hijriMonths = [
      'Muharram', 'Safar', 'Rabi', 'Jumada', 'Rajab', "Sha'ban",
      'Ramadan', 'Shawwal', 'Dhul',
    ]
    const text = screen.getByText(/AH/).textContent ?? ''
    const hasMonth = hijriMonths.some(m => text.includes(m))
    expect(hasMonth).toBe(true)
  })
})
