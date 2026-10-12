import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LessonCard } from '@/features/plan/front/components/LessonCard'
import type { LessonTask } from '@/features/plan/types'

const makeLesson = (overrides: Partial<LessonTask> = {}): LessonTask => ({
  id: 'lesson_001',
  childId: 'child_001',
  subjectId: 'subj_001',
  householdId: 'hh_001',
  title: 'Test Lesson',
  dueDate: '2026-05-12',
  status: 'not_started',
  order: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('LessonCard status badge', () => {
  it('renders "Not started" badge for not_started lesson', () => {
    render(
      <LessonCard
        lesson={makeLesson({ status: 'not_started' })}
        childName="Adam"
        subjectName="Math"
      />
    )
    expect(screen.getByText('Not started')).toBeInTheDocument()
  })

  it('renders "Completed" badge for completed lesson', () => {
    render(
      <LessonCard
        lesson={makeLesson({ status: 'completed' })}
        childName="Adam"
        subjectName="Math"
      />
    )
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('renders "Skipped" badge for skipped lesson', () => {
    render(
      <LessonCard
        lesson={makeLesson({ status: 'skipped' })}
        childName="Adam"
        subjectName="Math"
      />
    )
    expect(screen.getByText('Skipped')).toBeInTheDocument()
  })

  it('applies green badge class for completed status', () => {
    render(
      <LessonCard
        lesson={makeLesson({ status: 'completed' })}
        childName="Adam"
        subjectName="Math"
      />
    )
    const badge = screen.getByText('Completed')
    expect(badge.className).toContain('bg-green-100')
    expect(badge.className).toContain('text-green-700')
  })

  it('applies amber badge class for skipped status', () => {
    render(
      <LessonCard
        lesson={makeLesson({ status: 'skipped' })}
        childName="Adam"
        subjectName="Math"
      />
    )
    const badge = screen.getByText('Skipped')
    expect(badge.className).toContain('bg-amber-100')
    expect(badge.className).toContain('text-amber-700')
  })

  it('applies slate badge class for not_started status', () => {
    render(
      <LessonCard
        lesson={makeLesson({ status: 'not_started' })}
        childName="Adam"
        subjectName="Math"
      />
    )
    const badge = screen.getByText('Not started')
    expect(badge.className).toContain('bg-slate-100')
    expect(badge.className).toContain('text-slate-600')
  })
})

describe('LessonCard display', () => {
  it('renders lesson title', () => {
    render(
      <LessonCard
        lesson={makeLesson({ title: 'Algebra Basics' })}
        childName="Adam"
        subjectName="Math"
      />
    )
    expect(screen.getByText('Algebra Basics')).toBeInTheDocument()
  })

  it('renders child name and subject name', () => {
    render(
      <LessonCard
        lesson={makeLesson()}
        childName="Sarah"
        subjectName="Science"
      />
    )
    expect(screen.getByText(/Sarah/)).toBeInTheDocument()
    expect(screen.getByText(/Science/)).toBeInTheDocument()
  })

  it('renders Edit (Pencil) icon button when onEdit is provided', () => {
    const onEdit = jest.fn()
    render(
      <LessonCard
        lesson={makeLesson()}
        childName="Adam"
        subjectName="Math"
        onEdit={onEdit}
      />
    )
    const editBtn = screen.getByRole('button', { name: /edit lesson/i })
    expect(editBtn).toBeInTheDocument()
    fireEvent.click(editBtn)
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'lesson_001' }))
  })

  it('renders Delete (Trash) icon button when onDelete is provided', () => {
    const onDelete = jest.fn()
    render(
      <LessonCard
        lesson={makeLesson()}
        childName="Adam"
        subjectName="Math"
        onDelete={onDelete}
      />
    )
    expect(screen.getByRole('button', { name: /delete lesson/i })).toBeInTheDocument()
  })

  it('renders a saved resourceLink as a clickable link', () => {
    render(
      <LessonCard
        lesson={makeLesson({ resourceLink: 'https://example.com/video' })}
        childName="Adam"
        subjectName="Math"
      />
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://example.com/video')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('shows description excerpt when description is present', () => {
    render(
      <LessonCard
        lesson={makeLesson({ description: 'Learn fractions step by step' })}
        childName="Adam"
        subjectName="Math"
      />
    )
    expect(screen.getByText('Learn fractions step by step')).toBeInTheDocument()
  })

  it('clicking Pencil icon with onUpdate expands inline edit form', () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonCard
        lesson={makeLesson({ title: 'Algebra Basics' })}
        childName="Adam"
        subjectName="Math"
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))
    expect(screen.getByRole('button', { name: /save lesson/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel edit/i })).toBeInTheDocument()
  })

  it('does not crash when card title is clicked and no onEdit/onUpdate is provided', () => {
    render(
      <LessonCard
        lesson={makeLesson({ title: 'Algebra Basics' })}
        childName="Adam"
        subjectName="Math"
      />
    )
    expect(() => fireEvent.click(screen.getByText('Algebra Basics'))).not.toThrow()
  })
})

describe('LessonCard — FB-011 overdue badge', () => {
  it('shows Overdue badge for not_started lesson with past due date', () => {
    render(
      <LessonCard
        lesson={makeLesson({ status: 'not_started', dueDate: '2026-01-01' })}
        childName="Adam"
        subjectName="Math"
      />
    )
    expect(screen.getByText('Overdue')).toBeInTheDocument()
  })

  it('does not show Overdue badge for completed lesson with past due date', () => {
    render(
      <LessonCard
        lesson={makeLesson({ status: 'completed', dueDate: '2026-01-01' })}
        childName="Adam"
        subjectName="Math"
      />
    )
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
  })

  it('does not show Overdue badge for not_started lesson with future due date', () => {
    render(
      <LessonCard
        lesson={makeLesson({ status: 'not_started', dueDate: '2099-12-31' })}
        childName="Adam"
        subjectName="Math"
      />
    )
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
  })
})

describe('LessonCard — phase-1 date terminology in inline edit', () => {
  it('inline edit shows "Due date" label (not "Planned date")', () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonCard
        lesson={makeLesson()}
        childName="Adam"
        subjectName="Math"
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))
    expect(screen.getByText(/^due date$/i)).toBeInTheDocument()
    expect(screen.queryByText(/planned date/i)).not.toBeInTheDocument()
  })
})

describe('LessonCard — phase-2 Available-from field in inline edit', () => {
  it('inline edit renders an "Available from" date input', () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonCard
        lesson={makeLesson({ plannedStartDate: '2026-05-01' })}
        childName="Adam"
        subjectName="Math"
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))
    expect(screen.getByLabelText(/available from/i)).toBeInTheDocument()
  })

  it('inline edit pre-fills Available from with lesson.plannedStartDate', () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonCard
        lesson={makeLesson({ plannedStartDate: '2026-05-01' })}
        childName="Adam"
        subjectName="Math"
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))
    const input = screen.getByLabelText(/available from/i) as HTMLInputElement
    expect(input.value).toBe('2026-05-01')
  })

  it('saving with edited Available from calls onUpdate with plannedStartDate set', async () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonCard
        lesson={makeLesson({ plannedStartDate: '2026-05-01', title: 'Algebra' })}
        childName="Adam"
        subjectName="Math"
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))
    fireEvent.change(screen.getByLabelText(/available from/i), { target: { value: '2026-05-10' } })
    fireEvent.click(screen.getByRole('button', { name: /save lesson/i }))

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        'lesson_001',
        expect.objectContaining({ plannedStartDate: '2026-05-10' }),
      )
    })
  })

  // null, not undefined: the update route leaves plannedStartDate alone unless it is sent.
  it('saving without Available from passes plannedStartDate as null when field is empty', async () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonCard
        lesson={makeLesson({ plannedStartDate: undefined, title: 'Algebra' })}
        childName="Adam"
        subjectName="Math"
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))
    // Available from field should be empty
    const input = screen.getByLabelText(/available from/i) as HTMLInputElement
    expect(input.value).toBe('')
    fireEvent.click(screen.getByRole('button', { name: /save lesson/i }))

    await waitFor(() => {
      const patch = onUpdate.mock.calls[0][1]
      expect(patch.plannedStartDate).toBeNull()
    })
  })

  it('inline edit also renders "Due date" input', () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonCard
        lesson={makeLesson()}
        childName="Adam"
        subjectName="Math"
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))
    expect(screen.getByLabelText(/^due date$/i)).toBeInTheDocument()
  })
})

describe('LessonCard — phase-3 mark-done icon', () => {
  it('renders Check icon button for not_started lesson when onComplete is provided', () => {
    const onComplete = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonCard
        lesson={makeLesson({ status: 'not_started' })}
        childName="Adam"
        subjectName="Math"
        onComplete={onComplete}
      />
    )
    expect(screen.getByRole('button', { name: /mark lesson done/i })).toBeInTheDocument()
  })

  it('clicking mark-done button calls onComplete with id and completed', async () => {
    const onComplete = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonCard
        lesson={makeLesson({ id: 'lesson_001', status: 'not_started' })}
        childName="Adam"
        subjectName="Math"
        onComplete={onComplete}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /mark lesson done/i }))
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('lesson_001', 'completed')
    })
  })

  it('does NOT render Check icon when status is completed', () => {
    const onComplete = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonCard
        lesson={makeLesson({ status: 'completed' })}
        childName="Adam"
        subjectName="Math"
        onComplete={onComplete}
      />
    )
    expect(screen.queryByRole('button', { name: /mark lesson done/i })).not.toBeInTheDocument()
  })

  it('does NOT render Check icon when status is skipped', () => {
    const onComplete = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonCard
        lesson={makeLesson({ status: 'skipped' })}
        childName="Adam"
        subjectName="Math"
        onComplete={onComplete}
      />
    )
    expect(screen.queryByRole('button', { name: /mark lesson done/i })).not.toBeInTheDocument()
  })

  it('does NOT render Check icon when onComplete is not provided', () => {
    render(
      <LessonCard
        lesson={makeLesson({ status: 'not_started' })}
        childName="Adam"
        subjectName="Math"
      />
    )
    expect(screen.queryByRole('button', { name: /mark lesson done/i })).not.toBeInTheDocument()
  })
})

describe('LessonCard — grouped lessons', () => {
  it('shows a group affordance when groupId is set', () => {
    render(
      <LessonCard
        lesson={makeLesson({ groupId: 'group_001' })}
        childName="Adam"
        subjectName="Math"
      />
    )
    expect(screen.getByText(/group lesson/i)).toBeInTheDocument()
  })

  it('offers apply-to-group when editing a grouped lesson with onUpdate', () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonCard
        lesson={makeLesson({ groupId: 'group_001', title: 'Shared task' })}
        childName="Adam"
        subjectName="Math"
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))
    expect(screen.getByRole('checkbox', { name: /apply to all learners in group/i })).toBeInTheDocument()
  })

  // UAT 4.5 (Oct 10): a title edit on a shared lesson changed only one learner's copy
  // because this box started unticked. Editing a shared lesson now edits the group.
  it('starts with apply-to-group ticked for a grouped lesson', () => {
    render(
      <LessonCard
        lesson={makeLesson({ groupId: 'group_001', title: 'Shared task' })}
        childName="Adam"
        subjectName="Math"
        onUpdate={jest.fn().mockResolvedValue(undefined)}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))
    expect(screen.getByRole('checkbox', { name: /apply to all learners in group/i })).toBeChecked()
  })

  it('passes applyToGroup by default when saving a grouped lesson', async () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonCard
        lesson={makeLesson({ groupId: 'group_001', title: 'Shared task' })}
        childName="Adam"
        subjectName="Math"
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))
    fireEvent.change(screen.getByDisplayValue('Shared task'), { target: { value: 'Updated title' } })
    fireEvent.click(screen.getByRole('button', { name: /save lesson/i }))

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        'lesson_001',
        expect.objectContaining({ title: 'Updated title', applyToGroup: true }),
      )
    })
  })

  it('does not pass applyToGroup when the box is unticked', async () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonCard
        lesson={makeLesson({ groupId: 'group_001', title: 'Shared task' })}
        childName="Adam"
        subjectName="Math"
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /apply to all learners in group/i }))
    fireEvent.change(screen.getByDisplayValue('Shared task'), { target: { value: 'Solo edit' } })
    fireEvent.click(screen.getByRole('button', { name: /save lesson/i }))

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        'lesson_001',
        expect.objectContaining({ title: 'Solo edit' }),
      )
      expect(onUpdate.mock.calls[0][1].applyToGroup).toBeUndefined()
    })
  })

  it('sends a cleared "Available from" date as null so the server clears it', async () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonCard
        lesson={makeLesson({ plannedStartDate: '2026-05-01' })}
        childName="Adam"
        subjectName="Math"
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))
    fireEvent.change(screen.getByDisplayValue('2026-05-01'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /save lesson/i }))

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled()
    })
    expect(onUpdate.mock.calls[0][1].plannedStartDate).toBeNull()
  })
})

// ─── Group edits: details follow the group, date/time stay with this learner ───
// A parent moving one sick child's lesson must not move four other children.

describe('LessonCard — group edit keeps date and time per learner', () => {
  function openGroupEditor(onUpdate = jest.fn().mockResolvedValue(undefined)) {
    render(
      <LessonCard
        lesson={makeLesson({ groupId: 'group_001', title: 'Shared task', dueDate: '2026-05-12' })}
        childName="Adam"
        subjectName="Math"
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))
    return onUpdate
  }

  it('says date and time change for this learner only, with an unticked "move for everyone" box', () => {
    openGroupEditor()
    expect(screen.getByRole('checkbox', { name: /move the date and time for every learner/i })).not.toBeChecked()
    expect(screen.getByText(/date and time change for adam only/i)).toBeInTheDocument()
  })

  it('saving a new date with the default boxes does not ask to move everyone', async () => {
    const onUpdate = openGroupEditor()
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2026-05-13' } })
    fireEvent.click(screen.getByRole('button', { name: /save lesson/i }))

    await waitFor(() => expect(onUpdate).toHaveBeenCalled())
    const patch = onUpdate.mock.calls[0][1]
    expect(patch).toMatchObject({ dueDate: '2026-05-13', applyToGroup: true })
    expect(patch.applyScheduleToGroup).toBeUndefined()
  })

  it('ticking "move for everyone" sends applyScheduleToGroup', async () => {
    const onUpdate = openGroupEditor()
    fireEvent.click(screen.getByRole('checkbox', { name: /move the date and time for every learner/i }))
    expect(screen.queryByText(/date and time change for adam only/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /save lesson/i }))

    await waitFor(() => expect(onUpdate).toHaveBeenCalled())
    expect(onUpdate.mock.calls[0][1]).toMatchObject({ applyToGroup: true, applyScheduleToGroup: true })
  })

  it('unticking the group box hides "move for everyone" and sends neither flag', async () => {
    const onUpdate = openGroupEditor()
    fireEvent.click(screen.getByRole('checkbox', { name: /apply to all learners in group/i }))
    expect(screen.queryByRole('checkbox', { name: /move the date and time for every learner/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /save lesson/i }))

    await waitFor(() => expect(onUpdate).toHaveBeenCalled())
    expect(onUpdate.mock.calls[0][1].applyToGroup).toBeUndefined()
    expect(onUpdate.mock.calls[0][1].applyScheduleToGroup).toBeUndefined()
  })

  it('no group boxes on a lesson that is not shared', () => {
    render(<LessonCard lesson={makeLesson()} childName="Adam" subjectName="Math" onUpdate={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))
    expect(screen.queryByRole('checkbox', { name: /apply to all learners in group/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /move the date and time/i })).not.toBeInTheDocument()
  })
})

// ─── Moving a lesson to another learner or course ───

describe('LessonCard — changing the learner or course', () => {
  const kids = [
    { id: 'child_001', householdId: 'hh_001', name: 'Adam', gradeLabel: '5th', isActive: true, username: 'a', password: 'pw', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'child_002', householdId: 'hh_001', name: 'Khadijah', gradeLabel: '3rd', isActive: true, username: 'k', password: 'pw', createdAt: '2026-01-01T00:00:00Z' },
  ]
  const courses = [
    { id: 'subj_001', childId: 'child_001', learnerIds: ['child_001'], name: 'Math 5', category: 'Math' as const, isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'subj_002', childId: 'child_002', learnerIds: ['child_002'], name: 'Math 3', category: 'Math' as const, isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
  ]

  function openEditor(onUpdate = jest.fn().mockResolvedValue(undefined)) {
    render(
      <LessonCard lesson={makeLesson()} childName="Adam" subjectName="Math 5"
        children={kids} subjects={courses} onUpdate={onUpdate} />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))
    return onUpdate
  }

  it('moves the lesson to another learner and one of their courses', async () => {
    const onUpdate = openEditor()
    fireEvent.change(screen.getByLabelText(/^child$/i), { target: { value: 'child_002' } })
    fireEvent.change(screen.getByLabelText(/^course$/i), { target: { value: 'subj_002' } })
    fireEvent.click(screen.getByRole('button', { name: /save lesson/i }))

    await waitFor(() => expect(onUpdate).toHaveBeenCalled())
    expect(onUpdate.mock.calls[0][1]).toMatchObject({ childId: 'child_002', subjectId: 'subj_002' })
  })

  it("only offers the new learner's courses", () => {
    openEditor()
    fireEvent.change(screen.getByLabelText(/^child$/i), { target: { value: 'child_002' } })
    const course = screen.getByLabelText(/^course$/i)
    expect(Array.from((course as HTMLSelectElement).options).map(o => o.value)).toEqual(['', 'subj_002'])
  })

  it('asks for a course after switching learner, and saves nothing until one is chosen', async () => {
    const onUpdate = openEditor()
    fireEvent.change(screen.getByLabelText(/^child$/i), { target: { value: 'child_002' } })
    fireEvent.click(screen.getByRole('button', { name: /save lesson/i }))

    expect(await screen.findByText(/choose a course for khadijah/i)).toBeInTheDocument()
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it("shows the server's reason when a save is rejected, and keeps the editor open", async () => {
    const onUpdate = jest.fn().mockRejectedValue(new Error("Math 3 is not one of Adam's courses."))
    openEditor(onUpdate)
    fireEvent.click(screen.getByRole('button', { name: /save lesson/i }))

    expect(await screen.findByText(/math 3 is not one of adam's courses/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save lesson/i })).toBeInTheDocument()
  })
})
