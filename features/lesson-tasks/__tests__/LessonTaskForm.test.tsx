/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LessonTaskForm } from '@/features/lesson-tasks/front/components/LessonTaskForm'
import type { LessonTask } from '@/features/lesson-tasks/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

const child1: StudentProfile = {
  id: 'child_1',
  householdId: 'h1',
  name: 'Adam',
  gradeLabel: '5',
  username: 'adam',
  password: 'pass',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const child2: StudentProfile = {
  id: 'child_2',
  householdId: 'h1',
  name: 'Khadijah',
  gradeLabel: '3',
  username: 'khadijah',
  password: 'pass',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const adamSubject: SubjectCourse = {
  id: 'subj_adam_1',
  childId: 'child_1',
  name: 'Mathematics',
  category: 'Math',
  isActive: true,
  order: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const khadiSubject: SubjectCourse = {
  id: 'subj_khadi_1',
  childId: 'child_2',
  name: 'Reading',
  category: 'Reading',
  isActive: true,
  order: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const existingTask: LessonTask = {
  id: 'task_existing',
  childId: 'child_1',
  subjectId: 'subj_adam_1',
  title: 'Existing lesson title',
  date: '2026-05-12',
  status: 'completed',
  notes: 'Some notes here',
  createdAt: '2026-05-11T07:00:00.000Z',
  updatedAt: '2026-05-11T07:00:00.000Z',
}

describe('LessonTaskForm — Blank create mode', () => {
  it('all fields empty or default', () => {
    render(
      <LessonTaskForm
        children={[child1]}
        subjects={[adamSubject]}
        onSubmit={jest.fn()}
      />
    )
    expect(screen.getByPlaceholderText(/chapter 4 reading/i)).toHaveValue('')
  })

  it('date field defaults to today', () => {
    render(
      <LessonTaskForm
        children={[child1]}
        subjects={[adamSubject]}
        onSubmit={jest.fn()}
      />
    )
    const today = new Date().toISOString().split('T')[0]
    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement
    expect(dateInput.value).toBe(today)
  })

  it('status defaults to not_started', () => {
    render(
      <LessonTaskForm
        children={[child1]}
        subjects={[adamSubject]}
        onSubmit={jest.fn()}
      />
    )
    const statusSelect = screen.getByLabelText(/status/i) as HTMLSelectElement
    expect(statusSelect.value).toBe('not_started')
  })

  it('submit button says "Add lesson"', () => {
    render(
      <LessonTaskForm
        children={[child1]}
        subjects={[adamSubject]}
        onSubmit={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /add lesson/i })).toBeInTheDocument()
  })
})

describe('LessonTaskForm — Edit mode', () => {
  it('fields pre-populated with existing values', () => {
    render(
      <LessonTaskForm
        children={[child1]}
        subjects={[adamSubject]}
        initialValues={existingTask}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByDisplayValue('Existing lesson title')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Some notes here')).toBeInTheDocument()
  })

  it('submit button says "Save changes"', () => {
    render(
      <LessonTaskForm
        children={[child1]}
        subjects={[adamSubject]}
        initialValues={existingTask}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('Cancel button visible', () => {
    render(
      <LessonTaskForm
        children={[child1]}
        subjects={[adamSubject]}
        initialValues={existingTask}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })
})

describe('LessonTaskForm — No subjects available', () => {
  it('subject dropdown shows disabled "No subjects" option', () => {
    render(
      <LessonTaskForm
        children={[child1]}
        subjects={[]}
        onSubmit={jest.fn()}
      />
    )
    expect(screen.getByText(/no subjects/i)).toBeInTheDocument()
  })
})

describe('LessonTaskForm — Validation errors', () => {
  it('blank title shows error', async () => {
    const user = userEvent.setup()
    render(
      <LessonTaskForm
        children={[child1]}
        subjects={[adamSubject]}
        onSubmit={jest.fn()}
      />
    )
    await user.click(screen.getByRole('button', { name: /add lesson/i }))
    expect(screen.getByText(/title is required/i)).toBeInTheDocument()
  })

  it('invalid resource link shows error', async () => {
    const user = userEvent.setup()
    render(
      <LessonTaskForm
        children={[child1]}
        subjects={[adamSubject]}
        onSubmit={jest.fn()}
      />
    )
    await user.type(screen.getByPlaceholderText(/chapter 4 reading/i), 'My lesson')
    await user.type(screen.getByPlaceholderText(/https:\/\//i), 'javascript:alert(1)')
    await user.click(screen.getByRole('button', { name: /add lesson/i }))
    expect(screen.getByText(/must start with http/i)).toBeInTheDocument()
  })
})

describe('LessonTaskForm — Pending/submitting state', () => {
  it('submit button disabled while submitting', async () => {
    const user = userEvent.setup()
    let resolveSubmit!: () => void
    const onSubmit = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve
        })
    )
    render(
      <LessonTaskForm
        children={[child1]}
        subjects={[adamSubject]}
        onSubmit={onSubmit}
      />
    )
    await user.type(screen.getByPlaceholderText(/chapter 4 reading/i), 'Test lesson')
    await user.click(screen.getByRole('button', { name: /add lesson/i }))
    expect(screen.getByRole('button', { name: /add lesson/i })).toBeDisabled()
    resolveSubmit()
  })
})

describe('LessonTaskForm — Child/subject interaction', () => {
  it('subject dropdown filters by selected child', async () => {
    const user = userEvent.setup()
    render(
      <LessonTaskForm
        children={[child1, child2]}
        subjects={[adamSubject, khadiSubject]}
        onSubmit={jest.fn()}
      />
    )
    // Initially shows Adam's subjects
    expect(screen.getByDisplayValue('Mathematics')).toBeInTheDocument()

    // Switch to Khadijah
    const childSelect = screen.getByLabelText(/child/i) as HTMLSelectElement
    await user.selectOptions(childSelect, 'child_2')

    // Now shows Khadijah's subjects
    expect(screen.getByDisplayValue('Reading')).toBeInTheDocument()
  })
})
