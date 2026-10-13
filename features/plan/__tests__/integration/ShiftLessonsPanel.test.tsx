import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShiftLessonsPanel } from '@/features/plan/front/components/ShiftLessonsPanel'
import type { LessonDateMove, ShiftPreview } from '@/features/plan/types'
import type { DayOfWeek } from '@/features/lib/types'

const mockPreviewShift = jest.fn()
const mockApplyShift = jest.fn()
jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    previewShift: (...args: unknown[]) => mockPreviewShift(...args),
    applyShift: (...args: unknown[]) => mockApplyShift(...args),
  },
}))

const LEARNERS = [{ id: 'l1', name: 'Adam' }, { id: 'l2', name: 'Samura' }]
const COURSES = [{ id: 's_math', name: 'Math' }, { id: 's_read', name: 'Reading' }]

function move(id: string, learnerId = 'l1', fromDue = '2026-10-13', toDue = '2026-10-20'): LessonDateMove {
  return {
    id, learnerId, subjectId: 's_math', title: `Lesson ${id}`,
    from: { dueDate: fromDue, plannedStartDate: null }, to: { dueDate: toDue, plannedStartDate: null },
  }
}

function preview(moves: LessonDateMove[], pastYearEndCount = 0): ShiftPreview {
  const countsByLearner: Record<string, number> = {}
  for (const m of moves) countsByLearner[m.learnerId] = (countsByLearner[m.learnerId] ?? 0) + 1
  return { moves, countsByLearner, pastYearEndCount, schoolYearEnd: '2027-05-28' }
}

let onShifted: jest.Mock
let onClose: jest.Mock

function renderPanel(schoolDays?: DayOfWeek[]) {
  return render(
    <ShiftLessonsPanel
      learners={LEARNERS}
      courses={COURSES}
      schoolDays={schoolDays}
      today="2026-10-13"
      onShifted={onShifted}
      onClose={onClose}
    />,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  onShifted = jest.fn()
  onClose = jest.fn()
  mockPreviewShift.mockResolvedValue(preview([]))
  mockApplyShift.mockResolvedValue({ applied: 0, skipped: [] })
})

describe('ShiftLessonsPanel — form', () => {
  it('defaults to today, 1 school day, all learners and all courses', () => {
    renderPanel()
    expect(screen.getByLabelText(/move lessons from/i)).toHaveValue('2026-10-13')
    expect(screen.getByLabelText(/school days later/i)).toHaveValue(1)
    for (const name of ['Adam', 'Samura', 'Math', 'Reading']) {
      expect(screen.getByRole('checkbox', { name })).toBeChecked()
    }
  })

  it('"1 week" uses the household school-day count (5 by default, 6 for a six-day week)', async () => {
    const { unmount } = renderPanel()
    await userEvent.click(screen.getByRole('button', { name: '1 week' }))
    expect(screen.getByLabelText(/school days later/i)).toHaveValue(5)
    unmount()

    renderPanel(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])
    await userEvent.click(screen.getByRole('button', { name: '1 week' }))
    expect(screen.getByLabelText(/school days later/i)).toHaveValue(6)
    await userEvent.click(screen.getByRole('button', { name: '1 day' }))
    expect(screen.getByLabelText(/school days later/i)).toHaveValue(1)
  })

  it('Cancel closes without calling the API', async () => {
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(onClose).toHaveBeenCalled()
    expect(mockPreviewShift).not.toHaveBeenCalled()
  })
})

describe('ShiftLessonsPanel — preview', () => {
  it('sends no filters when everything is selected, and summarizes the moves', async () => {
    mockPreviewShift.mockResolvedValue(preview([move('a'), move('b'), move('c', 'l2')]))
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: '1 week' }))
    await userEvent.click(screen.getByRole('button', { name: /preview/i }))

    expect(mockPreviewShift).toHaveBeenCalledWith({ mode: 'shift', fromDate: '2026-10-13', schoolDays: 5 })
    const summary = await screen.findByTestId('shift-preview')
    expect(summary).toHaveTextContent('3 lessons for 2 learners move 5 school days later.')
    expect(summary).toHaveTextContent('Adam: 2')
    expect(summary).toHaveTextContent('Samura: 1')
    expect(screen.getByRole('button', { name: /confirm/i })).toBeEnabled()
    expect(mockApplyShift).not.toHaveBeenCalled()
  })

  it('sends learner and course filters when some are unchecked', async () => {
    renderPanel()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Samura' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Reading' }))
    fireEvent.change(screen.getByLabelText(/move lessons from/i), { target: { value: '2026-10-19' } })
    await userEvent.click(screen.getByRole('button', { name: /preview/i }))
    expect(mockPreviewShift).toHaveBeenCalledWith({
      mode: 'shift', fromDate: '2026-10-19', schoolDays: 1, learnerIds: ['l1'], subjectIds: ['s_math'],
    })
  })

  it('warns when lessons would land after the school year ends', async () => {
    mockPreviewShift.mockResolvedValue(preview([move('a')], 4))
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: /preview/i }))
    expect(await screen.findByText('4 lessons will land after the school year ends (May 28, 2027).')).toBeInTheDocument()
  })

  it('shows an empty message and disables Confirm when nothing matches', async () => {
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: /preview/i }))
    expect(await screen.findByText(/no not-started lessons on or after oct 13, 2026 match/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled()
  })

  it('changing the form after a preview clears the stale preview', async () => {
    mockPreviewShift.mockResolvedValue(preview([move('a')]))
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: /preview/i }))
    await screen.findByTestId('shift-preview')
    await userEvent.click(screen.getByRole('button', { name: '1 week' }))
    expect(screen.queryByTestId('shift-preview')).not.toBeInTheDocument()
  })

  it('disables Preview when no learner is selected', async () => {
    renderPanel()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Adam' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Samura' }))
    expect(screen.getByRole('button', { name: /preview/i })).toBeDisabled()
  })

  it('shows the API error', async () => {
    mockPreviewShift.mockRejectedValue(new Error('fromDate must be a valid YYYY-MM-DD date'))
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: /preview/i }))
    expect(await screen.findByText('fromDate must be a valid YYYY-MM-DD date')).toBeInTheDocument()
  })
})

describe('ShiftLessonsPanel — confirm and undo', () => {
  const moves = [move('a'), move('b', 'l2')]

  async function previewAndConfirm() {
    mockPreviewShift.mockResolvedValue(preview(moves))
    renderPanel()
    await userEvent.click(screen.getByRole('button', { name: /preview/i }))
    await userEvent.click(await screen.findByRole('button', { name: /confirm/i }))
  }

  it('applies the previewed moves, refreshes the planner and offers Undo', async () => {
    mockApplyShift.mockResolvedValueOnce({ applied: 2, skipped: [] })
    await previewAndConfirm()

    await waitFor(() => expect(mockApplyShift).toHaveBeenCalledWith(moves.map(m => ({ id: m.id, from: m.from, to: m.to }))))
    expect(onShifted).toHaveBeenCalledTimes(1)
    const notice = await screen.findByText('2 lessons moved')
    expect(notice).toBeInTheDocument()
    expect(screen.queryByTestId('shift-preview')).not.toBeInTheDocument()

    mockApplyShift.mockResolvedValueOnce({ applied: 2, skipped: [] })
    await userEvent.click(screen.getByRole('button', { name: /undo/i }))
    await waitFor(() => expect(mockApplyShift).toHaveBeenLastCalledWith(moves.map(m => ({ id: m.id, from: m.to, to: m.from }))))
    expect(onShifted).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('2 lessons moved back')).toBeInTheDocument()
  })

  it('reports lessons skipped because they changed, and Undo leaves them alone', async () => {
    mockApplyShift.mockResolvedValueOnce({ applied: 1, skipped: ['b'] })
    await previewAndConfirm()

    expect(await screen.findByText('1 lesson moved')).toBeInTheDocument()
    expect(screen.getByText('1 lesson was skipped because it changed since the preview.')).toBeInTheDocument()

    mockApplyShift.mockResolvedValueOnce({ applied: 1, skipped: [] })
    await userEvent.click(screen.getByRole('button', { name: /undo/i }))
    await waitFor(() => expect(mockApplyShift).toHaveBeenLastCalledWith([{ id: 'a', from: moves[0].to, to: moves[0].from }]))
  })

  it('shows the API error and keeps the preview when applying fails', async () => {
    mockApplyShift.mockRejectedValueOnce(new Error('Request failed: 500'))
    await previewAndConfirm()
    expect(await screen.findByText('Request failed: 500')).toBeInTheDocument()
    expect(within(screen.getByTestId('shift-preview')).getByRole('button', { name: /confirm/i })).toBeEnabled()
    expect(onShifted).not.toHaveBeenCalled()
  })
})
