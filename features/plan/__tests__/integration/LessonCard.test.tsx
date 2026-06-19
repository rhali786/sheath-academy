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

  it('saving without Available from passes plannedStartDate as undefined when field is empty', async () => {
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
      expect(patch.plannedStartDate).toBeUndefined()
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

  it('passes applyToGroup when saving with checkbox checked', async () => {
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
    fireEvent.change(screen.getByDisplayValue('Shared task'), { target: { value: 'Updated title' } })
    fireEvent.click(screen.getByRole('button', { name: /save lesson/i }))

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        'lesson_001',
        expect.objectContaining({ title: 'Updated title', applyToGroup: true }),
      )
    })
  })

  it('does not pass applyToGroup when saving without checkbox', async () => {
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
})
