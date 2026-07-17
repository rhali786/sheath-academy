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
  { id: 'subj_adam_math', childId: 'child_001', learnerIds: ['child_001'], name: 'Mathematics', category: 'Math', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'subj_adam_quran', childId: 'child_001', learnerIds: ['child_001'], name: 'Quran', category: 'Islamic', isActive: true, order: 2, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'subj_khad_math', childId: 'child_002', learnerIds: ['child_002'], name: 'Mathematics', category: 'Math', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'subj_khad_reading', childId: 'child_002', learnerIds: ['child_002'], name: 'Reading', category: 'English', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
]

const sharedAlgebraSubjects: SubjectCourse[] = [
  {
    id: 'subj_algebra_shared',
    childId: 'child_001',
    learnerIds: ['child_001', 'child_002'],
    name: 'Algebra',
    category: 'Math',
    isActive: true,
    order: 1,
    createdAt: '2026-01-01T00:00:00Z',
  },
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
  it('renders learner checkboxes with all children', () => {
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        onSubmit={jest.fn()}
      />
    )
    expect(screen.getByRole('checkbox', { name: /adam/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /khadijah/i })).toBeInTheDocument()
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
    const dateInput = screen.getByLabelText(/due date/i) as HTMLInputElement
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

  it('shows shared group course for a non-primary enrolled learner', () => {
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={sharedAlgebraSubjects}
        onSubmit={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /khadijah/i }))

    const subjectOptions = Array.from(
      (screen.getByLabelText(/course\/subject/i) as HTMLSelectElement).options,
    ).map((o) => o.text)
    expect(subjectOptions).toContain('Algebra')
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
    fireEvent.click(screen.getByRole('checkbox', { name: /adam/i }))

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
    fireEvent.click(screen.getByRole('checkbox', { name: /adam/i }))
    const subjectSelect = screen.getByLabelText(/course\/subject/i) as HTMLSelectElement
    fireEvent.change(subjectSelect, { target: { value: 'subj_adam_math' } })
    expect(subjectSelect.value).toBe('subj_adam_math')

    fireEvent.click(screen.getByRole('checkbox', { name: /adam/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /khadijah/i }))
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
    fireEvent.click(screen.getByRole('checkbox', { name: /adam/i }))
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

  it('submits curriculum, chapter, and homework/assessment flags when filled', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        onSubmit={onSubmit}
      />
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /adam/i }))
    fireEvent.change(screen.getByLabelText(/course\/subject/i), { target: { value: 'subj_adam_math' } })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Lesson' } })
    fireEvent.change(screen.getByLabelText(/curriculum/i), { target: { value: 'Saxon Math 5/4' } })
    fireEvent.change(screen.getByLabelText(/chapter/i), { target: { value: 'Lesson 12' } })
    fireEvent.click(screen.getByLabelText(/has homework/i))
    fireEvent.click(screen.getByLabelText(/has assessment/i))

    fireEvent.click(screen.getByRole('button', { name: /add lesson/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          curriculum: 'Saxon Math 5/4',
          chapter: 'Lesson 12',
          hasHomework: true,
          hasAssessment: true,
        })
      )
    })
  })

  it('omits curriculum/chapter/homework/assessment cleanly when left blank', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        onSubmit={onSubmit}
      />
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /adam/i }))
    fireEvent.change(screen.getByLabelText(/course\/subject/i), { target: { value: 'subj_adam_math' } })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Lesson' } })

    fireEvent.click(screen.getByRole('button', { name: /add lesson/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })
    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.curriculum).toBeUndefined()
    expect(submitted.chapter).toBeUndefined()
    expect(submitted.hasHomework).toBeUndefined()
    expect(submitted.hasAssessment).toBeUndefined()
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
    expect(screen.getByText(/learner\(s\)/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/^child$/i)).not.toBeInTheDocument()
  })

  it('uses "Course/Subject" label not "Subject"', () => {
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={jest.fn()} />
    )
    expect(screen.getByLabelText(/course\/subject/i)).toBeInTheDocument()
  })

  it('uses "Due date" label (not "Planned date") for dueDate field', () => {
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={jest.fn()} />
    )
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/planned date/i)).not.toBeInTheDocument()
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
    fireEvent.click(screen.getByRole('checkbox', { name: /adam/i }))
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

describe('LessonTaskForm — phase-1 date terminology', () => {
  it('renders "Available from" label (not "Start date") for plannedStartDate', () => {
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={jest.fn()} />
    )
    expect(screen.getByLabelText(/available from/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/start date/i)).not.toBeInTheDocument()
  })

  it('renders "Due date" label (not "Planned date") for dueDate', () => {
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={jest.fn()} />
    )
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/planned date/i)).not.toBeInTheDocument()
  })

  it('renders helper text about completion window', () => {
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={jest.fn()} />
    )
    expect(screen.getByText(/lesson can be completed any day from/i)).toBeInTheDocument()
  })

  it('submits plannedStartDate and dueDate with new labels', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={onSubmit} />
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /adam/i }))
    fireEvent.change(screen.getByLabelText(/course\/subject/i), { target: { value: 'subj_adam_math' } })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Terminology test' } })
    fireEvent.change(screen.getByLabelText(/available from/i), { target: { value: '2026-06-01' } })
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2026-06-15' } })

    fireEvent.click(screen.getByRole('button', { name: /add lesson/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          plannedStartDate: '2026-06-01',
          dueDate: '2026-06-15',
        })
      )
    })
  })
})

describe('LessonTaskForm — completion window (plannedStartDate)', () => {
  it('shows an optional "Available from" input for plannedStartDate', () => {
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={jest.fn()} />
    )
    expect(screen.getByLabelText(/available from/i)).toBeInTheDocument()
  })

  it('submits plannedStartDate when "Available from" date is set', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={onSubmit} />
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /adam/i }))
    fireEvent.change(screen.getByLabelText(/course\/subject/i), { target: { value: 'subj_adam_math' } })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Window lesson' } })
    fireEvent.change(screen.getByLabelText(/available from/i), { target: { value: '2026-05-10' } })
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2026-05-15' } })

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
    fireEvent.click(screen.getByRole('checkbox', { name: /adam/i }))
    fireEvent.change(screen.getByLabelText(/course\/subject/i), { target: { value: 'subj_adam_math' } })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Single-day lesson' } })
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2026-05-15' } })

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

describe('LessonTaskForm — scheduled start/end time override', () => {
  it('includes scheduledStartTime/scheduledEndTime in the update payload when both are set', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        editingLesson={editingLesson}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '11:00' } })
    fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: '11:30' } })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledStartTime: '11:00',
          scheduledEndTime: '11:30',
        })
      )
    })
  })

  it('submits cleared (undefined) times when both previously-set values are cleared', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const withTimes: LessonTask = { ...editingLesson, scheduledStartTime: '11:00', scheduledEndTime: '11:30' }
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        editingLesson={withTimes}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: '' } })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })
    expect(onSubmit.mock.calls[0][0].scheduledStartTime).toBeUndefined()
    expect(onSubmit.mock.calls[0][0].scheduledEndTime).toBeUndefined()
  })

  it('shows an inline validation error and does not submit when end time is at or before start time', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        editingLesson={editingLesson}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '11:30' } })
    fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: '11:00' } })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/end time must be after start time/i)).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('LessonTaskForm — off-day (household schoolDays) awareness', () => {
  it('shows a non-blocking inline warning when due date falls on an off day (default Mon–Fri schedule)', () => {
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={jest.fn()} />
    )
    // 2026-05-16 is a Saturday — an off day under the default Mon–Fri schedule
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2026-05-16' } })
    expect(screen.getByText(/off day/i)).toBeInTheDocument()
  })

  it('shows no warning when due date falls on a school day', () => {
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={jest.fn()} />
    )
    // 2026-05-14 is a Thursday — a school day under the default Mon–Fri schedule
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2026-05-14' } })
    expect(screen.queryByText(/off day/i)).not.toBeInTheDocument()
  })

  it('honors a custom schoolDays prop (co-op Saturday is not a warning; Wednesday off is)', () => {
    render(
      <LessonTaskForm
        children={mockChildren}
        subjects={mockSubjects}
        schoolDays={['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday']}
        onSubmit={jest.fn()}
      />
    )
    // 2026-05-16 is a Saturday — a school day for this household
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2026-05-16' } })
    expect(screen.queryByText(/off day/i)).not.toBeInTheDocument()

    // 2026-05-13 is a Wednesday — an off day for this household
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2026-05-13' } })
    expect(screen.getByText(/off day/i)).toBeInTheDocument()
  })

  it('submission is not blocked when due date falls on an off day', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={onSubmit} />
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /adam/i }))
    fireEvent.change(screen.getByLabelText(/course\/subject/i), { target: { value: 'subj_adam_math' } })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Off-day lesson' } })
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2026-05-16' } })

    fireEvent.click(screen.getByRole('button', { name: /add lesson/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ dueDate: '2026-05-16' })
      )
    })
  })

  it('warning is dismissible', () => {
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={jest.fn()} />
    )
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2026-05-16' } })
    expect(screen.getByText(/off day/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /dismiss off-day warning/i }))
    expect(screen.queryByText(/off day/i)).not.toBeInTheDocument()
  })
})

describe('LessonTaskForm — multi-learner group assignment', () => {
  it('allows selecting multiple learners via checkboxes', () => {
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={jest.fn()} />
    )
    expect(screen.getByRole('checkbox', { name: /adam/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /khadijah/i })).toBeInTheDocument()
  })

  it('submits the same subject id for a shared group course when 2+ learners selected', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonTaskForm children={mockChildren} subjects={sharedAlgebraSubjects} onSubmit={onSubmit} />
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /adam/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /khadijah/i }))
    fireEvent.change(screen.getByLabelText(/course\/subject/i), {
      target: { value: 'subj_algebra_shared' },
    })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Shared algebra' } })
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2026-05-15' } })

    fireEvent.click(screen.getByRole('button', { name: /add lesson/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          childIds: ['child_001', 'child_002'],
          assignments: [
            { childId: 'child_001', subjectId: 'subj_algebra_shared' },
            { childId: 'child_002', subjectId: 'subj_algebra_shared' },
          ],
        }),
      )
    })
  })

  it('submits childIds and per-learner assignments when 2+ learners selected', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonTaskForm children={mockChildren} subjects={mockSubjects} onSubmit={onSubmit} />
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /adam/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /khadijah/i }))
    fireEvent.change(screen.getByLabelText(/course\/subject/i), { target: { value: 'subj_adam_math' } })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Shared lesson' } })
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2026-05-15' } })

    fireEvent.click(screen.getByRole('button', { name: /add lesson/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          childIds: ['child_001', 'child_002'],
          assignments: [
            { childId: 'child_001', subjectId: 'subj_adam_math' },
            { childId: 'child_002', subjectId: 'subj_khad_math' },
          ],
        })
      )
    })
  })
})
