/**
 * Integration tests for Wave 1b — learner/course selectors in LessonGenerationPanel
 * TDD: written before full implementation
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LessonGenerationPanel } from '@/features/resources/front/components/LessonGenerationPanel'
import type { Resource } from '@/features/resources/types'
import type { HouseholdContextType } from '@/features/household/front/context/HouseholdContext'

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

jest.mock('@/features/resources/front/services/api', () => ({
  resourcesApi: {
    generateLessons: jest.fn(),
  },
}))

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    createLesson: jest.fn(),
  },
}))

const { useHousehold } = jest.requireMock('@/features/household/front/context') as {
  useHousehold: jest.MockedFunction<() => HouseholdContextType>
}
const { resourcesApi } = jest.requireMock('@/features/resources/front/services/api') as {
  resourcesApi: { generateLessons: jest.Mock }
}
const { plannerApi } = jest.requireMock('@/features/plan/front/services/api') as {
  plannerApi: { createLesson: jest.Mock }
}

const resource: Resource = {
  id: 'resource_001',
  workspaceId: 'household_001',
  title: 'Saxon Math 7/6',
  resourceType: 'textbook',
  totalChapters: 12,
  verificationStatus: 'verified',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const loadedHousehold: HouseholdContextType = {
  householdProfile: {
    id: 'household_001',
    workspaceId: 'household_001',
    familyName: 'Test Family',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  studentProfiles: [
    {
      id: 'child_001',
      householdId: 'household_001',
      name: 'Aisha',
      gradeLabel: 'Grade 5',
      username: 'aisha',
      password: 'pw',
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'child_002',
      householdId: 'household_001',
      name: 'Yusuf',
      gradeLabel: 'Grade 3',
      username: 'yusuf',
      password: 'pw',
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  allSubjects: [
    {
      id: 'subject_001',
      childId: 'child_001',
      learnerIds: ['child_001'],
      name: 'Math 7/6',
      category: 'Math',
      isActive: true,
      order: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'subject_002',
      childId: 'child_002',
      learnerIds: ['child_002'],
      name: 'Arabic Level 2',
      category: 'Arabic',
      isActive: true,
      order: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  familyName: 'Test Family',
  needsSetup: false,
  loading: false,
  error: null,
  refetch: jest.fn(),
}

const generated = [
  { title: 'Chapter 1', dueDate: '2026-01-05', order: 1 },
  { title: 'Chapter 2', dueDate: '2026-01-06', order: 2 },
]

describe('LessonGenerationPanel — learner/course selectors', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useHousehold.mockReturnValue(loadedHousehold)
    resourcesApi.generateLessons.mockResolvedValue({ status: 'success', data: generated, message: '', timestamp: '' })
    plannerApi.createLesson.mockResolvedValue({
      id: 'lesson_001',
      childId: 'child_001',
      subjectId: 'subject_001',
      householdId: 'household_001',
      title: 'Chapter 1',
      dueDate: '2026-01-05',
      status: 'not_started',
      order: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
  })

  it('renders a learner multi-select with checkboxes for each child', () => {
    render(<LessonGenerationPanel resource={resource} />)
    expect(screen.getByRole('checkbox', { name: 'Aisha' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Yusuf' })).toBeInTheDocument()
  })

  it('renders a course select filtered to the selected learner(s)', async () => {
    render(<LessonGenerationPanel resource={resource} />)

    // Before selecting any learner, neither course should be selectable as an option
    const courseSelect = screen.getByTestId('generation-course-select') as HTMLSelectElement
    expect(courseSelect).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Math 7/6' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Arabic Level 2' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Aisha' }))

    expect(screen.getByRole('option', { name: 'Math 7/6' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Arabic Level 2' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Yusuf' }))

    expect(screen.getByRole('option', { name: 'Math 7/6' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Arabic Level 2' })).toBeInTheDocument()
  })

  it('renders a disabled "Save to plan" button (with a hint) before any lessons have been generated — regression for c75d361b', () => {
    render(<LessonGenerationPanel resource={resource} />)
    const saveButton = screen.getByRole('button', { name: /save to plan/i })
    expect(saveButton).toBeInTheDocument()
    expect(saveButton).toBeDisabled()
    expect(screen.getByText(/generate lessons.*pick learner.*pick course/i)).toBeInTheDocument()
  })

  it('renders a disabled "Save to plan" button until a learner and course are chosen, after generating lessons', async () => {
    render(<LessonGenerationPanel resource={resource} />)

    await userEvent.click(screen.getByTestId('generate-lessons-button'))
    expect(await screen.findByText(/2 lessons generated/i)).toBeInTheDocument()

    const saveButton = screen.getByRole('button', { name: /save to plan/i })
    expect(saveButton).toBeDisabled()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Aisha' }))
    expect(saveButton).toBeDisabled()

    await userEvent.selectOptions(screen.getByTestId('generation-course-select'), 'subject_001')
    expect(saveButton).not.toBeDisabled()
  })

  it('saves generated lessons to the planner when "Save to plan" is clicked', async () => {
    render(<LessonGenerationPanel resource={resource} />)

    await userEvent.click(screen.getByTestId('generate-lessons-button'))
    expect(await screen.findByText(/2 lessons generated/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Aisha' }))
    await userEvent.selectOptions(screen.getByTestId('generation-course-select'), 'subject_001')

    const saveButton = screen.getByRole('button', { name: /save to plan/i })
    expect(saveButton).not.toBeDisabled()

    await userEvent.click(saveButton)

    expect(plannerApi.createLesson).toHaveBeenCalledTimes(2)
    expect(plannerApi.createLesson).toHaveBeenNthCalledWith(1, expect.objectContaining({
      childId: 'child_001',
      subjectId: 'subject_001',
      householdId: 'household_001',
      title: 'Chapter 1',
      dueDate: '2026-01-05',
      status: 'not_started',
      order: 1,
    }))
    expect(plannerApi.createLesson).toHaveBeenNthCalledWith(2, expect.objectContaining({
      childId: 'child_001',
      subjectId: 'subject_001',
      householdId: 'household_001',
      title: 'Chapter 2',
      dueDate: '2026-01-06',
      status: 'not_started',
      order: 2,
    }))

    expect(await screen.findByText(/2 lessons added to the planner/i)).toBeInTheDocument()

    expect(saveButton).toBeDisabled()
  })
})

describe('LessonGenerationPanel — pacing control', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useHousehold.mockReturnValue(loadedHousehold)
    resourcesApi.generateLessons.mockResolvedValue({ status: 'success', data: generated, message: '', timestamp: '' })
  })

  it('renders a Pacing select with the school-day option selected by default, and no N input', () => {
    render(<LessonGenerationPanel resource={resource} />)

    const pacingSelect = screen.getByTestId('generation-pacing-select') as HTMLSelectElement
    expect(pacingSelect).toBeInTheDocument()
    expect(pacingSelect.value).toBe('schoolDay')
    expect(screen.getByRole('option', { name: 'Every school day' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Once a week' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Every N days' })).toBeInTheDocument()

    expect(screen.queryByTestId('generation-cadence-days-input')).not.toBeInTheDocument()
  })

  it('shows an N input only when "Every N days" is selected, and passes cadence/cadenceDays to generateLessons', async () => {
    render(<LessonGenerationPanel resource={resource} />)

    const pacingSelect = screen.getByTestId('generation-pacing-select')

    await userEvent.selectOptions(pacingSelect, 'weekly')
    expect(screen.queryByTestId('generation-cadence-days-input')).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('generate-lessons-button'))
    expect(resourcesApi.generateLessons).toHaveBeenLastCalledWith(
      expect.objectContaining({ cadence: 'weekly' })
    )

    await userEvent.selectOptions(pacingSelect, 'everyNDays')
    const nInput = screen.getByTestId('generation-cadence-days-input') as HTMLInputElement
    expect(nInput).toBeInTheDocument()
    expect(nInput).toHaveAttribute('min', '1')

    await userEvent.clear(nInput)
    await userEvent.type(nInput, '3')

    await userEvent.click(screen.getByTestId('generate-lessons-button'))
    expect(resourcesApi.generateLessons).toHaveBeenLastCalledWith(
      expect.objectContaining({ cadence: 'everyNDays', cadenceDays: 3 })
    )
  })

  it('passes cadence "schoolDay" by default when generating lessons', async () => {
    render(<LessonGenerationPanel resource={resource} />)

    await userEvent.click(screen.getByTestId('generate-lessons-button'))
    expect(resourcesApi.generateLessons).toHaveBeenLastCalledWith(
      expect.objectContaining({ cadence: 'schoolDay' })
    )
  })
})

describe('LessonGenerationPanel — start-at control', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useHousehold.mockReturnValue(loadedHousehold)
    resourcesApi.generateLessons.mockResolvedValue({ status: 'success', data: generated, message: '', timestamp: '' })
  })

  it('renders a Start-at input, and passes startAt through to generateLessons', async () => {
    render(<LessonGenerationPanel resource={resource} />)

    const startAtInput = screen.getByTestId('generation-start-at-input') as HTMLInputElement
    expect(startAtInput).toBeInTheDocument()

    await userEvent.clear(startAtInput)
    await userEvent.type(startAtInput, '5')

    await userEvent.click(screen.getByTestId('generate-lessons-button'))
    expect(resourcesApi.generateLessons).toHaveBeenLastCalledWith(
      expect.objectContaining({ startAt: 5 })
    )
  })

  it('omits startAt when left blank', async () => {
    render(<LessonGenerationPanel resource={resource} />)

    await userEvent.click(screen.getByTestId('generate-lessons-button'))
    const call = resourcesApi.generateLessons.mock.calls[0][0]
    expect(call.startAt).toBeUndefined()
  })
})

describe('LessonGenerationPanel — course-days control', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useHousehold.mockReturnValue(loadedHousehold)
    resourcesApi.generateLessons.mockResolvedValue({ status: 'success', data: generated, message: '', timestamp: '' })
  })

  it('defaults course days to Mon-Fri checked, Sat/Sun unchecked, when the household has no schoolDays set', () => {
    render(<LessonGenerationPanel resource={resource} />)
    expect(screen.getByRole('checkbox', { name: 'Monday' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Tuesday' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Wednesday' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Thursday' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Friday' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Saturday' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Sunday' })).not.toBeChecked()
  })

  it('deselecting Wednesday removes it from the schoolDaysOfWeek passed to generateLessons', async () => {
    render(<LessonGenerationPanel resource={resource} />)

    const wedCheckbox = screen.getByRole('checkbox', { name: 'Wednesday' })
    expect(wedCheckbox).toBeChecked()
    await userEvent.click(wedCheckbox)
    expect(wedCheckbox).not.toBeChecked()

    await userEvent.click(screen.getByTestId('generate-lessons-button'))
    const call = resourcesApi.generateLessons.mock.calls[0][0]
    expect(call.schoolDaysOfWeek).toEqual(['Monday', 'Tuesday', 'Thursday', 'Friday'])
    expect(call.schoolDaysOfWeek).not.toContain('Wednesday')
  })

  it('selecting only Monday/Wednesday/Friday passes just those weekdays to generateLessons', async () => {
    render(<LessonGenerationPanel resource={resource} />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Tuesday' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Thursday' }))

    await userEvent.click(screen.getByTestId('generate-lessons-button'))
    const call = resourcesApi.generateLessons.mock.calls[0][0]
    expect(call.schoolDaysOfWeek).toEqual(['Monday', 'Wednesday', 'Friday'])
  })
})
