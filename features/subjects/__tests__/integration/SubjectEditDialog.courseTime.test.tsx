/**
 * @jest-environment jsdom
 *
 * UAT 4.1 — "In Settings → Courses, edit a course … and add a recurring time … e.g. 10:15–11:00."
 * UAT 4.6 — "Change the course time to 9:00 – 9:45."
 *
 * A course's weekly time can only be set when the course is CREATED (SubjectForm).
 * The edit dialog (Settings → Courses → Edit) has no time fields, so 4.6 cannot be
 * done in the app and 4.1 only works by creating a new course. The PUT route
 * already accepts `recurringSchedule` (null clears it).
 *
 * Assertions are on the wire form of the update, as the route receives it.
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SubjectEditDialog } from '@/features/subjects/front/components/SubjectEditDialog'
import type { SubjectCourse } from '@/features/subjects/types'
import type { DayOfWeek } from '@/features/lib/types'

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: { updateSubject: jest.fn() },
}))
jest.mock('@/features/resources/front/services/api', () => ({
  resourcesApi: { listResources: jest.fn() },
}))

const { subjectsApi } = jest.requireMock('@/features/subjects/front/services/api') as {
  subjectsApi: { updateSubject: jest.Mock }
}
const { resourcesApi } = jest.requireMock('@/features/resources/front/services/api') as {
  resourcesApi: { listResources: jest.Mock }
}

const WEEKDAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function course(overrides: Partial<SubjectCourse> = {}): SubjectCourse {
  return {
    id: 'subj_math',
    childId: 'c1',
    learnerIds: ['c1'],
    resourceIds: [],
    name: 'Math',
    category: 'Math',
    isActive: true,
    order: 1,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderDialog(subject: SubjectCourse) {
  render(
    <SubjectEditDialog
      open
      subject={subject}
      childrenList={[{ id: 'c1', name: 'Ada' }]}
      onClose={jest.fn()}
      onSaved={jest.fn()}
    />,
  )
  return screen.getByRole('dialog')
}

function wireBodyOfUpdate(): Record<string, unknown> {
  expect(subjectsApi.updateSubject).toHaveBeenCalled()
  const [id, patch] = subjectsApi.updateSubject.mock.calls[0]
  expect(id).toBe('subj_math')
  return JSON.parse(JSON.stringify(patch))
}

async function setTimeInput(input: HTMLElement, value: string) {
  const user = userEvent.setup()
  await user.clear(input)
  await user.type(input, value)
}

beforeEach(() => {
  subjectsApi.updateSubject.mockResolvedValue({ status: 'success', data: course() })
  resourcesApi.listResources.mockResolvedValue({ data: [] })
})
afterEach(() => jest.clearAllMocks())

describe('UAT 4.6 — changing an existing course time', () => {
  const timed = () =>
    course({ recurringSchedule: [{ daysOfWeek: WEEKDAYS, startTime: '10:15', endTime: '11:00' }] })

  it('shows the course\'s current weekly time when editing', () => {
    const dialog = renderDialog(timed())
    expect(within(dialog).getByLabelText('Start time')).toHaveValue('10:15')
    expect(within(dialog).getByLabelText('End time')).toHaveValue('11:00')
  })

  it('changing 10:15–11:00 to 9:00–9:45 saves the new time on the same days', async () => {
    const dialog = renderDialog(timed())
    await setTimeInput(within(dialog).getByLabelText('Start time'), '09:00')
    await setTimeInput(within(dialog).getByLabelText('End time'), '09:45')
    await userEvent.setup().click(within(dialog).getByRole('button', { name: /save/i }))

    await waitFor(() => expect(subjectsApi.updateSubject).toHaveBeenCalled())
    expect(wireBodyOfUpdate().recurringSchedule).toEqual([
      { daysOfWeek: WEEKDAYS, startTime: '09:00', endTime: '09:45' },
    ])
  })

  it('removing the weekly time sends null so the course has no time', async () => {
    const dialog = renderDialog(timed())
    await userEvent.setup().click(within(dialog).getByRole('button', { name: /remove recurring weekly schedule/i }))
    await userEvent.setup().click(within(dialog).getByRole('button', { name: /save/i }))
    await waitFor(() => expect(subjectsApi.updateSubject).toHaveBeenCalled())
    expect(wireBodyOfUpdate()).toHaveProperty('recurringSchedule', null)
  })

  it('saving without touching the time keeps it as it was', async () => {
    const dialog = renderDialog(timed())
    await userEvent.setup().click(within(dialog).getByRole('button', { name: /save/i }))
    await waitFor(() => expect(subjectsApi.updateSubject).toHaveBeenCalled())
    const body = wireBodyOfUpdate()
    if ('recurringSchedule' in body) {
      expect(body.recurringSchedule).toEqual([{ daysOfWeek: WEEKDAYS, startTime: '10:15', endTime: '11:00' }])
    }
  })
})

describe('UAT 4.1 — adding a weekly time to an existing course', () => {
  it('a course with no time offers to add one, and saving sends it', async () => {
    const dialog = renderDialog(course())
    await userEvent.setup().click(within(dialog).getByRole('button', { name: /add recurring weekly schedule/i }))
    const block = within(dialog).getByTestId('recurring-block-0')
    const user = userEvent.setup()
    await user.click(within(block).getByTestId('recurring-day-Wednesday-0'))
    await setTimeInput(within(block).getByLabelText('Start time'), '10:15')
    await setTimeInput(within(block).getByLabelText('End time'), '11:00')
    await user.click(within(dialog).getByRole('button', { name: /save/i }))

    await waitFor(() => expect(subjectsApi.updateSubject).toHaveBeenCalled())
    expect(wireBodyOfUpdate().recurringSchedule).toEqual([
      { daysOfWeek: ['Wednesday'], startTime: '10:15', endTime: '11:00' },
    ])
  })

  it('saving a course that never had a time does not invent one', async () => {
    const dialog = renderDialog(course())
    await userEvent.setup().click(within(dialog).getByRole('button', { name: /save/i }))
    await waitFor(() => expect(subjectsApi.updateSubject).toHaveBeenCalled())
    expect(wireBodyOfUpdate().recurringSchedule ?? null).toBeNull()
  })
})
