import { render, screen } from '@testing-library/react'
import { GroupEditOptions } from '@/features/plan/front/components/GroupEditOptions'

// UAT 2.4 (Amir, 2026-10-12): "move for everyone" pulled a learner who had been moved to
// another day back to this learner's day. Only what the parent changes is copied now, and
// the editor says so, so a parent knows another learner's own day or title is safe.
function renderOptions(overrides: Partial<Parameters<typeof GroupEditOptions>[0]> = {}) {
  return render(
    <GroupEditOptions
      childName="Bilal"
      applyToGroup
      applyScheduleToGroup={false}
      onApplyToGroupChange={jest.fn()}
      onApplyScheduleToGroupChange={jest.fn()}
      {...overrides}
    />,
  )
}

describe('GroupEditOptions', () => {
  it('says only what the parent changes is copied to the other learners', () => {
    renderOptions()
    expect(screen.getByText('Only what you change here is copied to the other learners.')).toBeInTheDocument()
  })

  it('says date and time stay with this learner while "also move" is unticked', () => {
    renderOptions()
    expect(screen.getByText('Date and time change for Bilal only.')).toBeInTheDocument()
  })

  it('with "also move" ticked, drops the "only Bilal" line but keeps the "only what you change" line', () => {
    renderOptions({ applyScheduleToGroup: true })
    expect(screen.queryByText('Date and time change for Bilal only.')).not.toBeInTheDocument()
    expect(screen.getByText('Only what you change here is copied to the other learners.')).toBeInTheDocument()
  })

  it('unticked: this learner only, so neither line shows', () => {
    renderOptions({ applyToGroup: false })
    expect(screen.queryByText(/Only what you change/)).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Also move the date and time for every learner' })).not.toBeInTheDocument()
  })
})
