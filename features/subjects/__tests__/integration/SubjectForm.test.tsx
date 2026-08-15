/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SubjectForm } from '@/features/subjects/front/components/SubjectForm'
import type { StudentProfile } from '@/features/lib/types'

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getChildren: jest.fn(),
  },
}))

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: {
    createSubject: jest.fn(),
  },
}))

const { childrenApi } = jest.requireMock('@/features/children/front/services/api') as {
  childrenApi: { getChildren: jest.Mock }
}
const { subjectsApi } = jest.requireMock('@/features/subjects/front/services/api') as {
  subjectsApi: { createSubject: jest.Mock }
}

const householdId = 'workspace_001'

const oneChild: StudentProfile[] = [
  {
    id: 'kid1',
    householdId,
    name: 'Test Child',
    gradeLabel: '3',
    username: 't',
    password: 'p',
    isActive: true,
    createdAt: '2026-01-01',
  },
]

const twoChildren: StudentProfile[] = [
  { ...oneChild[0], id: 'k1', name: 'Ada', username: 'ada1' },
  { ...oneChild[0], id: 'k2', name: 'Ben', username: 'ben1' },
]

describe('SubjectForm — Wave 8 FB-003', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    childrenApi.getChildren.mockResolvedValue({ data: twoChildren })
    subjectsApi.createSubject.mockResolvedValue({ data: {}, status: 'success' })
  })

  it('renders "Course / Subject name" label', async () => {
    render(<SubjectForm householdId={householdId} />)
    await waitFor(() => expect(screen.getByTestId('subject-form')).toBeInTheDocument())
    expect(screen.getByLabelText(/course \/ subject name/i)).toBeInTheDocument()
  })

  it('renders Learner(s) multi-select checkboxes', async () => {
    render(<SubjectForm householdId={householdId} />)
    await waitFor(() => expect(screen.getByTestId('subject-form')).toBeInTheDocument())
    // Both learners should appear as selectable options
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Ben')).toBeInTheDocument()
  })

  it('category dropdown contains "Quran" as first option', async () => {
    render(<SubjectForm householdId={householdId} />)
    await waitFor(() => expect(screen.getByTestId('subject-form')).toBeInTheDocument())
    const select = screen.getByLabelText(/category/i) as HTMLSelectElement
    expect(select.options[0].text).toBe('Quran')
  })

  it('category dropdown contains "Arabic" and "Islamic Studies"', async () => {
    render(<SubjectForm householdId={householdId} />)
    await waitFor(() => expect(screen.getByTestId('subject-form')).toBeInTheDocument())
    const select = screen.getByLabelText(/category/i) as HTMLSelectElement
    const options = Array.from(select.options).map(o => o.text)
    expect(options).toContain('Arabic')
    expect(options).toContain('Islamic Studies')
  })

  it('shows custom input when "Other/Custom" is selected', async () => {
    render(<SubjectForm householdId={householdId} />)
    await waitFor(() => expect(screen.getByTestId('subject-form')).toBeInTheDocument())
    const select = screen.getByLabelText(/category/i)
    await userEvent.selectOptions(select, 'OtherCustom')
    expect(screen.getByLabelText(/custom category/i)).toBeInTheDocument()
  })
})

describe('SubjectForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state while fetching children', () => {
    childrenApi.getChildren.mockReturnValue(new Promise(() => {}))
    render(<SubjectForm householdId={householdId} />)
    expect(screen.getByTestId('subject-form-loading')).toBeInTheDocument()
  })

  it('renders no-household when householdId is blank', async () => {
    render(<SubjectForm householdId="" />)
    await waitFor(() => {
      expect(screen.getByTestId('subject-form-no-household')).toBeInTheDocument()
    })
  })

  it('renders empty state when no children exist for household', async () => {
    childrenApi.getChildren.mockResolvedValue({ data: [] })
    render(<SubjectForm householdId={householdId} />)
    await waitFor(() => {
      expect(screen.getByTestId('subject-form-no-children')).toBeInTheDocument()
    })
  })

  it('shows learner checkbox when one child exists', async () => {
    childrenApi.getChildren.mockResolvedValue({ data: oneChild })
    render(<SubjectForm householdId={householdId} />)
    await waitFor(() => {
      expect(screen.getByTestId('subject-form')).toBeInTheDocument()
    })
    // Should show child name as a checkbox label
    expect(screen.getByText('Test Child')).toBeInTheDocument()
    // Checkbox should be pre-checked when there is only one child
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('with hideChildSelect and multiple children, omits learner checkboxes and shows tab hint', async () => {
    childrenApi.getChildren.mockResolvedValue({ data: twoChildren })
    render(<SubjectForm householdId={householdId} hideChildSelect defaultChildId="k1" />)
    await waitFor(() => {
      expect(screen.getByTestId('subject-form')).toBeInTheDocument()
    })
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.getByTestId('subject-form-tabs-hint')).toBeInTheDocument()
  })

  it('submits valid form and calls onSuccess', async () => {
    childrenApi.getChildren.mockResolvedValue({ data: oneChild })
    subjectsApi.createSubject.mockResolvedValue({ data: {}, status: 'success' })
    const onSuccess = jest.fn()
    render(<SubjectForm householdId={householdId} onSuccess={onSuccess} />)
    await waitFor(() => {
      expect(screen.getByTestId('subject-form')).toBeInTheDocument()
    })
    await userEvent.type(screen.getByPlaceholderText(/Algebra/i), 'Algebra I')
    await userEvent.click(screen.getByRole('button', { name: /Add course/i }))
    await waitFor(() => {
      expect(subjectsApi.createSubject).toHaveBeenCalled()
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('sends full learnerIds array when multiple learners are selected (regression: no silent truncation to [0])', async () => {
    childrenApi.getChildren.mockResolvedValue({ data: twoChildren })
    subjectsApi.createSubject.mockResolvedValue({ data: {}, status: 'success' })
    render(<SubjectForm householdId={householdId} />)
    await waitFor(() => expect(screen.getByTestId('subject-form')).toBeInTheDocument())

    // Check both Ada and Ben
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
    await userEvent.click(checkboxes[0]) // Ada
    await userEvent.click(checkboxes[1]) // Ben

    await userEvent.type(screen.getByPlaceholderText(/Algebra/i), 'Family Arabic')
    await userEvent.click(screen.getByRole('button', { name: /Add course/i }))

    await waitFor(() => expect(subjectsApi.createSubject).toHaveBeenCalled())
    const callArg = subjectsApi.createSubject.mock.calls[0][0]
    expect(callArg.learnerIds).toHaveLength(2)
    expect(callArg.learnerIds).toContain('k1')
    expect(callArg.learnerIds).toContain('k2')
  })
})

describe('SubjectForm — recurring weekly schedule (Wave 3 part 2)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    childrenApi.getChildren.mockResolvedValue({ data: oneChild })
    subjectsApi.createSubject.mockResolvedValue({ data: {}, status: 'success' })
  })

  it('recurring schedule editor is hidden until the toggle is clicked', async () => {
    render(<SubjectForm householdId={householdId} />)
    await waitFor(() => expect(screen.getByTestId('subject-form')).toBeInTheDocument())
    expect(screen.queryByTestId('recurring-schedule-editor')).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('recurring-schedule-toggle'))
    expect(screen.getByTestId('recurring-schedule-editor')).toBeInTheDocument()
  })

  it('submitting without completing a recurring block omits recurringSchedule (regression: no empty/partial blocks sent)', async () => {
    render(<SubjectForm householdId={householdId} />)
    await waitFor(() => expect(screen.getByTestId('subject-form')).toBeInTheDocument())

    await userEvent.click(screen.getByTestId('recurring-schedule-toggle'))
    await userEvent.type(screen.getByPlaceholderText(/Algebra/i), 'Quran Memorization')
    await userEvent.click(screen.getByRole('button', { name: /Add course/i }))

    await waitFor(() => expect(subjectsApi.createSubject).toHaveBeenCalled())
    const callArg = subjectsApi.createSubject.mock.calls[0][0]
    expect(callArg.recurringSchedule).toBeUndefined()
  })

  it('submitting a completed recurring block sends recurringSchedule with the chosen days and times', async () => {
    render(<SubjectForm householdId={householdId} />)
    await waitFor(() => expect(screen.getByTestId('subject-form')).toBeInTheDocument())

    await userEvent.click(screen.getByTestId('recurring-schedule-toggle'))
    await userEvent.click(screen.getByTestId('recurring-day-Monday-0'))
    await userEvent.click(screen.getByTestId('recurring-day-Wednesday-0'))
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '09:00' } })
    fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: '09:45' } })

    await userEvent.type(screen.getByPlaceholderText(/Algebra/i), 'Quran Memorization')
    await userEvent.click(screen.getByRole('button', { name: /Add course/i }))

    await waitFor(() => expect(subjectsApi.createSubject).toHaveBeenCalled())
    const callArg = subjectsApi.createSubject.mock.calls[0][0]
    expect(callArg.recurringSchedule).toEqual([
      { daysOfWeek: ['Monday', 'Wednesday'], startTime: '09:00', endTime: '09:45' },
    ])
  })

  it('"Add another time block" adds a second independent block', async () => {
    render(<SubjectForm householdId={householdId} />)
    await waitFor(() => expect(screen.getByTestId('subject-form')).toBeInTheDocument())

    await userEvent.click(screen.getByTestId('recurring-schedule-toggle'))
    await userEvent.click(screen.getByTestId('recurring-add-block'))

    expect(screen.getByTestId('recurring-block-0')).toBeInTheDocument()
    expect(screen.getByTestId('recurring-block-1')).toBeInTheDocument()
  })
})
