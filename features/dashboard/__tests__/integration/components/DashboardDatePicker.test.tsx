import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardDatePicker } from '@/features/dashboard/front/components/DashboardDatePicker'

describe('DashboardDatePicker', () => {
  test('displays formatted selected date', () => {
    render(<DashboardDatePicker selectedDate="2026-05-24" onDateChange={jest.fn()} />)
    expect(screen.getByTestId('dashboard-selected-date')).toHaveTextContent('May 24, 2026')
  })

  test('prev/next buttons change date', () => {
    const onDateChange = jest.fn()
    render(<DashboardDatePicker selectedDate="2026-05-24" onDateChange={onDateChange} />)
    fireEvent.click(screen.getByLabelText('Previous day'))
    expect(onDateChange).toHaveBeenCalledWith('2026-05-23')
    fireEvent.click(screen.getByLabelText('Next day'))
    expect(onDateChange).toHaveBeenCalledWith('2026-05-25')
  })
})
