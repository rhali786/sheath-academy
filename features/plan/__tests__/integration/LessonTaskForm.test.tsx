import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LessonTaskForm } from '@/features/plan/front/components/LessonTaskForm'
import type { LessonTask } from '@/features/plan/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

const mockChildren: StudentProfile[] = [
  { id: 'child_001', householdId: 'hh_001', name: 'Adam', gradeLabel: '5th', isActive: true, username: 'adam', password: 'pw', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'child_002', householdId: 'hh_001', name: 'Khadijah', gradeLabel: '3rd', isActive: true, username: 'khad', password: 'pw', createdAt: '2026-01-01T00:00:00Z' },
]

const mockSubjects: SubjectCourse[] = [
  { id: 'subj_adam_math', childId: 'child_001', name: 'Mathematics', category: 'Math', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'subj_adam_quran', childId: 'child_001', name: 'Quran', category: 'Islamic', isActive: true, order: 2, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'subj_khad_reading', childId: 'child_002', name: 'Reading', category: 'English', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
]

const editingLesson: LessonTask = {
  id: 'lesson_001',
  childId: 'child_001',
  subjectId: 'subj_adam_math',
  householdId: 'hh_001',
  title: 'Existing Lesson',
  description: 'Some notes',
  dueDate: '2026-05-12',
  status: 'completed',
  order: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('LessonTaskForm — create mode', () => {
  it('renders child dropdown with all children', () => {
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        onSubmit={jest.fn()}
      />
    )
    expect(screen.getByText('Adam')).toBeInTheDocument()
    expect(screen.getByText('Khadijah')).toBeInTheDocument()
  })

  it('date input defaults to today', () => {
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        onSubmit={jest.fn()}
      />
    )
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const dateInput = screen.getByLabelText(/planned date/i) as HTMLInputElement
    expect(dateInput.value).toBe(`${y}-${m}-${d}`)
  })

  it('status defaults to not_started', () => {
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        onSubmit={jest.fn()}
      />
    )
    const statusSelect = screen.getByLabelText(/status/i) as HTMLSelectElement
    expect(statusSelect.value).toBe('not_started')
  })

  it('does not show Cancel button in create mode', () => {
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        onSubmit={jest.fn()}
      />
    )
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
  })

  it('shows submit button labelled "Add lesson"', () => {
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        onSubmit={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /add lesson/i })).toBeInTheDocument()
  })

  it('subject dropdown is filtered to selected child', () => {
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        onSubmit={jest.fn()}
      />
    )
    // Select Adam (first child)
    const childSelect = screen.getByLabelText(/learner/i)
    fireEvent.change(childSelect, { target: { value: 'child_001' } })

    // Adam's subjects should appear in the subject select
    const subjectSelect = screen.getByLabelText(/course\/subject/i) as HTMLSelectElement
    const subjectOptions = Array.from(subjectSelect.options).map(o => o.text)
    expect(subjectOptions).toContain('Mathematics')
    expect(subjectOptions).toContain('Quran')
    // Khadijah's subject should not appear in the subject select
    expect(subjectOptions).not.toContain('Reading')
  })

  it('subject dropdown resets on child change', () => {
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        onSubmit={jest.fn()}
      />
    )
    // Select Adam and choose a subject
    const childSelect = screen.getByLabelText(/learner/i)
    fireEvent.change(childSelect, { target: { value: 'child_001' } })
    const subjectSelect = screen.getByLabelText(/course\/subject/i) as HTMLSelectElement
    fireEvent.change(subjectSelect, { target: { value: 'subj_adam_math' } })
    expect(subjectSelect.value).toBe('subj_adam_math')

    // Change to Khadijah — subject should reset
    fireEvent.change(childSelect, { target: { value: 'child_002' } })
    expect((screen.getByLabelText(/course\/subject/i) as HTMLSelectElement).value).toBe('')
  })

  it('shows validation error when title is empty on submit', async () => {
    const onSubmit = jest.fn()
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        onSubmit={onSubmit}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /add lesson/i }))
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct data when form is valid', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        onSubmit={onSubmit}
      />
    )
    fireEvent.change(screen.getByLabelText(/learner/i), { target: { value: 'child_001' } })
    fireEvent.change(screen.getByLabelText(/course\/subject/i), { target: { value: 'subj_adam_math' } })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Lesson' } })

    fireEvent.click(screen.getByRole('button', { name: /add lesson/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          childId: 'child_001',
          subjectId: 'subj_adam_math',
          title: 'New Lesson',
          status: 'not_started',
        })
      )
    })
  })
})

describe('LessonTaskForm — edit mode', () => {
  it('pre-populates fields from editingLesson', () => {
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        editingLesson={editingLesson}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect((screen.getByLabelText(/title/i) as HTMLInputElement).value).toBe('Existing Lesson')
    expect((screen.getByLabelText(/status/i) as HTMLSelectElement).value).toBe('completed')
  })

  it('shows submit button labelled "Save changes" in edit mode', () => {
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        editingLesson={editingLesson}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('shows Cancel button in edit mode', () => {
    const onCancel = jest.fn()
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        editingLesson={editingLesson}
        onSubmit={jest.fn()}
        onCancel={onCancel}
      />
    )
    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    expect(cancelBtn).toBeInTheDocument()
    fireEvent.click(cancelBtn)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

describe('LessonTaskForm — FB-011 label renames', () => {
  it('uses "Learner(s)" label not "Child"', () => {
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={jest.fn()} />
    )
    expect(screen.getByLabelText(/learner/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/^child$/i)).not.toBeInTheDocument()
  })

  it('uses "Course/Subject" label not "Subject"', () => {
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={jest.fn()} />
    )
    expect(screen.getByLabelText(/course\/subject/i)).toBeInTheDocument()
  })

  it('uses "Planned date" label not "Due date"', () => {
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={jest.fn()} />
    )
    expect(screen.getByLabelText(/planned date/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/due date/i)).not.toBeInTheDocument()
  })

  it('shows Estimated duration dropdown', () => {
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={jest.fn()} />
    )
    expect(screen.getByLabelText(/estimated duration/i)).toBeInTheDocument()
    expect(screen.getByText('30 minutes')).toBeInTheDocument()
  })

  it('shows Lesson type dropdown with general types by default', () => {
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={jest.fn()} />
    )
    expect(screen.getByLabelText(/lesson type/i)).toBeInTheDocument()
    expect(screen.getByText('Assignment')).toBeInTheDocument()
  })

  it('shows Quran lesson types when a Quran category subject is selected', async () => {
    const quranSubjects: import('@/features/subjects/types').SubjectCourse[] = [
      { id: 'subj_quran', childId: 'child_001', name: 'Quran', category: 'Quran', isActive: true, order: 1, createdAt: '' },
    ]
    render(
      <LessonTaskForm children={mockChildren} subjects={quranSubjects} onSubmit={jest.fn()} />
    )
    fireEvent.change(screen.getByLabelText(/learner/i), { target: { value: 'child_001' } })
    fireEvent.change(screen.getByLabelText(/course\/subject/i), { target: { value: 'subj_quran' } })
    expect(screen.getByText('Memorisation')).toBeInTheDocument()
    expect(screen.getByText('Tajweed')).toBeInTheDocument()
    expect(screen.queryByText('Assignment')).not.toBeInTheDocument()
  })

  it('shows helper text in subject dropdown when no learner selected', () => {
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={jest.fn()} />
    )
    expect(screen.getByText(/choose a learner first/i)).toBeInTheDocument()
  })
})

describe('LessonTaskForm — completion window (plannedStartDate)', () => {
  it('shows an optional start-date input', () => {
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={jest.fn()} />
    )
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
  })

  it('submits plannedStartDate when start date is set', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={onSubmit} />
    )
    fireEvent.change(screen.getByLabelText(/learner/i), { target: { value: 'child_001' } })
    fireEvent.change(screen.getByLabelText(/course\/subject/i), { target: { value: 'subj_adam_math' } })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Window lesson' } })
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-05-10' } })
    fireEvent.change(screen.getByLabelText(/planned date/i), { target: { value: '2026-05-15' } })

    fireEvent.click(screen.getByRole('button', { name: /add lesson/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          plannedStartDate: '2026-05-10',
          dueDate: '2026-05-15',
        })
      )
    })
  })

  it('omits plannedStartDate when only due date is set (legacy back-compat)', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={onSubmit} />
    )
    fireEvent.change(screen.getByLabelText(/learner/i), { target: { value: 'child_001' } })
    fireEvent.change(screen.getByLabelText(/course\/subject/i), { target: { value: 'subj_adam_math' } })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Single-day lesson' } })
    fireEvent.change(screen.getByLabelText(/planned date/i), { target: { value: '2026-05-15' } })

    fireEvent.click(screen.getByRole('button', { name: /add lesson/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          dueDate: '2026-05-15',
        })
      )
      expect(onSubmit.mock.calls[0][0].plannedStartDate).toBeUndefined()
    })
  })
})
