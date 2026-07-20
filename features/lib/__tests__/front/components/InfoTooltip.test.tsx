import { render, screen, fireEvent } from '@testing-library/react'
import { InfoTooltip } from '@/features/lib/front/components/InfoTooltip'

describe('InfoTooltip', () => {
  it('does not show the tooltip text by default', () => {
    render(<InfoTooltip text="Helpful explanation" />)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows the tooltip on hover and hides it on mouse leave', () => {
    render(<InfoTooltip text="Helpful explanation" />)
    const trigger = screen.getByRole('button', { name: /more information/i })

    fireEvent.mouseEnter(trigger.parentElement as Element)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful explanation')

    fireEvent.mouseLeave(trigger.parentElement as Element)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows the tooltip on keyboard focus and hides it on blur, for keyboard/screen-reader users', () => {
    render(<InfoTooltip text="Helpful explanation" />)
    const trigger = screen.getByRole('button', { name: /more information/i })

    fireEvent.focus(trigger)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful explanation')

    fireEvent.blur(trigger)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
