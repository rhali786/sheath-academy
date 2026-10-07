import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SchoolBreaksPanel } from '@/features/school-year/front/components/SchoolBreaksPanel'
import type { SchoolBreak, SchoolYear } from '@/features/school-year/types'
import type { LessonDateMove, ShiftPreview } from '@/features/plan/types'

const mockUpdateSchoolYear = jest.fn()
jest.mock('@/features/school-year/front/services/api', () => ({
  schoolYearApi: { updateSchoolYear: (...args: unknown[]) => mockUpdateSchoolYear(...args) },
}))

const mockPreviewShift = jest.fn()
const mockApplyShift = jest.fn()
jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    previewShift: (...args: unknown[]) => mockPreviewShift(...args),
    applyShift: (...args: unknown[]) => mockApplyShift(...args),
  },
}))

const THANKSGIVING: SchoolBreak = { id: 'br_tg', name: 'Thanksgiving', startDate: '2026-11-25', endDate: '2026-11-27' }

function makeYear(breaks: SchoolBreak[] = []): SchoolYear {
  return {
    id: 'sy1', workspaceId: 'hh1', name: '2026-2027', startDate: '2026-08-01', endDate: '2027-05-31',
    isActive: true, createdAt: '2026-01-01T00:00:00Z', breaks,
  }
}

function move(id: string, fromDue: string, toDue: string, learnerId = 'l1'): LessonDateMove {
  return {
    id, learnerId, subjectId: 's1', title: `Lesson ${id}`,
    from: { dueDate: fromDue, plannedStartDate: null }, to: { dueDate: toDue, plannedStartDate: null },
  }
}

function preview(moves: LessonDateMove[]): ShiftPreview {
  const countsByLearner: Record<string, number> = {}
  for (const m of moves) countsByLearner[m.learnerId] = (countsByLearner[m.learnerId] ?? 0) + 1
  return { moves, countsByLearner, pastYearEndCount: 0, schoolYearEnd: '2027-05-31' }
}

function ok<T>(data: T) {
  return { status: 'success' as const, data, message: '', timestamp: '' }
}

let onYearUpdated: jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  onYearUpdated = jest.fn()
  // Echo the saved breaks back like the real PUT does.
  mockUpdateSchoolYear.mockImplementation(async (_id: string, patch: { breaks: SchoolBreak[] }) => ok(makeYear(patch.breaks)))
  mockPreviewShift.mockResolvedValue(preview([]))
  mockApplyShift.mockResolvedValue({ applied: 0, skipped: [] })
})

async function fillBreakForm(container: HTMLElement, values: { name: string; start: string; end: string }) {
  const form = within(container)
  await userEvent.clear(form.getByLabelText(/break name/i))
  if (values.name) await userEvent.type(form.getByLabelText(/break name/i), values.name)
  fireEvent.change(form.getByLabelText(/^start/i), { target: { value: values.start } })
  fireEvent.change(form.getByLabelText(/^end/i), { target: { value: values.end } })
}

describe('SchoolBreaksPanel — read states', () => {
  it('shows the empty state and opens the add form when there are no breaks', () => {
    render(<SchoolBreaksPanel year={makeYear()} onYearUpdated={onYearUpdated} />)
    expect(screen.getByText(/no breaks yet/i)).toBeInTheDocument()
    expect(screen.getByTestId('add-break-form')).toBeInTheDocument()
  })

  it('lists each break as a card with its dates, add form closed', () => {
    render(<SchoolBreaksPanel year={makeYear([THANKSGIVING])} onYearUpdated={onYearUpdated} />)
    const card = screen.getByTestId('break-br_tg')
    expect(card).toHaveTextContent('Thanksgiving')
    expect(card).toHaveTextContent('Nov 25, 2026 – Nov 27, 2026')
    expect(screen.queryByTestId('add-break-form')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add break/i })).toBeInTheDocument()
  })
})

describe('SchoolBreaksPanel — add', () => {
  it('saves a new break with the full breaks list and reports the updated year', async () => {
    render(<SchoolBreaksPanel year={makeYear([THANKSGIVING])} onYearUpdated={onYearUpdated} />)
    await userEvent.click(screen.getByRole('button', { name: /add break/i }))
    await fillBreakForm(screen.getByTestId('add-break-form'), { name: 'Winter', start: '2026-12-21', end: '2027-01-01' })
    await userEvent.click(within(screen.getByTestId('add-break-form')).getByRole('button', { name: /save break/i }))

    await waitFor(() => expect(mockUpdateSchoolYear).toHaveBeenCalled())
    const [id, patch] = mockUpdateSchoolYear.mock.calls[0]
    expect(id).toBe('sy1')
    expect(patch.breaks).toHaveLength(2)
    expect(patch.breaks[0]).toEqual(THANKSGIVING)
    expect(patch.breaks[1]).toMatchObject({ name: 'Winter', startDate: '2026-12-21', endDate: '2027-01-01' })
    expect(patch.breaks[1].id).toMatch(/^break_/)
    await waitFor(() => expect(onYearUpdated).toHaveBeenCalledWith(expect.objectContaining({ id: 'sy1' })))
  })

  it.each([
    [{ name: 'Backwards', start: '2026-12-10', end: '2026-12-01' }, /end date must be on or after/i],
    [{ name: 'Summer', start: '2027-06-10', end: '2027-06-20' }, /within the school year/i],
    [{ name: '', start: '2026-12-01', end: '2026-12-02' }, /give the break a name/i],
  ])('shows an inline error and does not save for %j', async (values, message) => {
    render(<SchoolBreaksPanel year={makeYear()} onYearUpdated={onYearUpdated} />)
    const form = screen.getByTestId('add-break-form')
    await fillBreakForm(form, values)
    await userEvent.click(within(form).getByRole('button', { name: /save break/i }))
    expect(await within(form).findByText(message)).toBeInTheDocument()
    expect(mockUpdateSchoolYear).not.toHaveBeenCalled()
  })

  it('shows the server error and keeps the form open when saving fails', async () => {
    mockUpdateSchoolYear.mockRejectedValue(new Error('Winter: the break must be within the school year'))
    render(<SchoolBreaksPanel year={makeYear()} onYearUpdated={onYearUpdated} />)
    const form = screen.getByTestId('add-break-form')
    await fillBreakForm(form, { name: 'Winter', start: '2026-12-21', end: '2027-01-01' })
    await userEvent.click(within(form).getByRole('button', { name: /save break/i }))
    expect(await screen.findByText(/winter: the break must be within the school year/i)).toBeInTheDocument()
    expect(screen.getByTestId('add-break-form')).toBeInTheDocument()
    expect(onYearUpdated).not.toHaveBeenCalled()
  })
})

describe('SchoolBreaksPanel — edit', () => {
  it('expands inline, and Cancel restores the card without saving', async () => {
    render(<SchoolBreaksPanel year={makeYear([THANKSGIVING])} onYearUpdated={onYearUpdated} />)
    await userEvent.click(screen.getByRole('button', { name: 'Edit Thanksgiving' }))
    const editor = screen.getByTestId('edit-break-br_tg')
    expect(within(editor).getByLabelText(/break name/i)).toHaveValue('Thanksgiving')
    await userEvent.click(within(editor).getByRole('button', { name: /cancel/i }))
    expect(screen.queryByTestId('edit-break-br_tg')).not.toBeInTheDocument()
    expect(screen.getByTestId('break-br_tg')).toHaveTextContent('Thanksgiving')
    expect(mockUpdateSchoolYear).not.toHaveBeenCalled()
  })

  it('Save persists the edited break in place and returns to read-only', async () => {
    render(<SchoolBreaksPanel year={makeYear([THANKSGIVING])} onYearUpdated={onYearUpdated} />)
    await userEvent.click(screen.getByRole('button', { name: 'Edit Thanksgiving' }))
    const editor = screen.getByTestId('edit-break-br_tg')
    await userEvent.clear(within(editor).getByLabelText(/break name/i))
    await userEvent.type(within(editor).getByLabelText(/break name/i), 'Thanksgiving week')
    await userEvent.click(within(editor).getByRole('button', { name: /save break/i }))

    await waitFor(() => expect(mockUpdateSchoolYear).toHaveBeenCalledWith('sy1', {
      breaks: [{ ...THANKSGIVING, name: 'Thanksgiving week' }],
    }))
    await waitFor(() => expect(screen.queryByTestId('edit-break-br_tg')).not.toBeInTheDocument())
  })
})

describe('SchoolBreaksPanel — remove', () => {
  it('asks for confirmation; Cancel keeps the break', async () => {
    render(<SchoolBreaksPanel year={makeYear([THANKSGIVING])} onYearUpdated={onYearUpdated} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove Thanksgiving' }))
    expect(screen.getByText(/remove thanksgiving\?/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(screen.getByTestId('break-br_tg')).toBeInTheDocument()
    expect(mockUpdateSchoolYear).not.toHaveBeenCalled()
  })

  it('Confirm saves without the break and shows a success notice', async () => {
    render(<SchoolBreaksPanel year={makeYear([THANKSGIVING])} onYearUpdated={onYearUpdated} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove Thanksgiving' }))
    await userEvent.click(screen.getByRole('button', { name: /^remove$/i }))
    await waitFor(() => expect(mockUpdateSchoolYear).toHaveBeenCalledWith('sy1', { breaks: [] }))
    expect(await screen.findByText('Thanksgiving removed')).toBeInTheDocument()
    expect(mockPreviewShift).not.toHaveBeenCalled()
  })
})

describe('SchoolBreaksPanel — move lessons out of a new break', () => {
  async function addThanksgiving() {
    render(<SchoolBreaksPanel year={makeYear()} onYearUpdated={onYearUpdated} />)
    const form = screen.getByTestId('add-break-form')
    await fillBreakForm(form, { name: 'Thanksgiving', start: '2026-11-25', end: '2026-11-27' })
    await userEvent.click(within(form).getByRole('button', { name: /save break/i }))
  }

  it('offers to move lessons that fall inside the saved break', async () => {
    mockPreviewShift.mockResolvedValue(preview([
      move('a', '2026-11-25', '2026-11-30'),
      move('b', '2026-11-27', '2026-12-02', 'l2'),
      move('c', '2026-12-01', '2026-12-04'),
    ]))
    await addThanksgiving()

    const prompt = await screen.findByTestId('break-shift-prompt')
    const savedBreakId = mockUpdateSchoolYear.mock.calls[0][1].breaks[0].id
    expect(mockPreviewShift).toHaveBeenCalledWith({ mode: 'break', breakId: savedBreakId })
    expect(prompt).toHaveTextContent('2 lessons fall in Thanksgiving. Move them after the break?')
    expect(prompt).toHaveTextContent('3 lessons for 2 learners will shift later to make room.')
  })

  it('does not prompt when nothing falls inside the break', async () => {
    mockPreviewShift.mockResolvedValue(preview([move('c', '2026-12-01', '2026-12-04')]))
    await addThanksgiving()
    await waitFor(() => expect(mockPreviewShift).toHaveBeenCalled())
    expect(screen.queryByTestId('break-shift-prompt')).not.toBeInTheDocument()
  })

  it('Not now dismisses the prompt without moving anything', async () => {
    mockPreviewShift.mockResolvedValue(preview([move('a', '2026-11-25', '2026-11-30')]))
    await addThanksgiving()
    await userEvent.click(await screen.findByRole('button', { name: /not now/i }))
    expect(screen.queryByTestId('break-shift-prompt')).not.toBeInTheDocument()
    expect(mockApplyShift).not.toHaveBeenCalled()
  })

  it('Move lessons applies the previewed moves, confirms, and Undo puts them back', async () => {
    const moves = [move('a', '2026-11-25', '2026-11-30'), move('b', '2026-11-26', '2026-12-01')]
    mockPreviewShift.mockResolvedValue(preview(moves))
    mockApplyShift.mockResolvedValueOnce({ applied: 2, skipped: [] })
    await addThanksgiving()

    await userEvent.click(await screen.findByRole('button', { name: /move lessons/i }))
    await waitFor(() => expect(mockApplyShift).toHaveBeenCalledWith(moves.map(m => ({ id: m.id, from: m.from, to: m.to }))))
    expect(await screen.findByText('2 lessons moved')).toBeInTheDocument()
    expect(screen.queryByTestId('break-shift-prompt')).not.toBeInTheDocument()

    mockApplyShift.mockResolvedValueOnce({ applied: 2, skipped: [] })
    await userEvent.click(screen.getByRole('button', { name: /undo/i }))
    await waitFor(() => expect(mockApplyShift).toHaveBeenLastCalledWith(moves.map(m => ({ id: m.id, from: m.to, to: m.from }))))
  })

  it('shows an error if moving fails and keeps the prompt', async () => {
    mockPreviewShift.mockResolvedValue(preview([move('a', '2026-11-25', '2026-11-30')]))
    mockApplyShift.mockRejectedValue(new Error('Request failed: 500'))
    await addThanksgiving()
    await userEvent.click(await screen.findByRole('button', { name: /move lessons/i }))
    expect(await screen.findByText(/request failed: 500/i)).toBeInTheDocument()
    expect(screen.getByTestId('break-shift-prompt')).toBeInTheDocument()
  })
})
