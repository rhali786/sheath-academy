import { render, screen } from '@testing-library/react'
import React from 'react'
import { EmptyWeekState } from '@/features/plan/front/components/EmptyWeekState'

describe('EmptyWeekState', () => {
  it('renders friendly message when passed empty lessons array', () => {
    render(<EmptyWeekState lessons={[]} />)

    const message = screen.getByText(/no lessons|take a breath|week looks clear|all caught up/i)
    expect(message).toBeInTheDocument()
  })

  it('does not render when lessons array is populated', () => {
    const { container } = render(<EmptyWeekState lessons={[{ id: 'lesson_001' }]} />)

    expect(container.firstChild).toBeNull()
  })

  it('message text is contextual and witty', () => {
    const { rerender } = render(<EmptyWeekState lessons={[]} />)

    let text = screen.queryByText(
      /no lessons scheduled for this week|take a breath|week looks clear|perfect time to rest|all caught up/i
    )
    expect(text).toBeInTheDocument()

    rerender(<EmptyWeekState lessons={[]} />)
  })
})
