import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { LessonCard } from '@/features/planner/front/components/LessonCard'
import type { LessonTask } from '@/features/planner/types'

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

  it('renders Edit button when onEdit is provided', () => {
    const onEdit = jest.fn()
    render(
      <LessonCard
        lesson={makeLesson()}
        childName="Adam"
        subjectName="Math"
        onEdit={onEdit}
      />
    )
    const editBtn = screen.getByText('Edit')
    expect(editBtn).toBeInTheDocument()
    fireEvent.click(editBtn)
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'lesson_001' }))
  })

  it('renders Delete button when onDelete is provided', () => {
    const onDelete = jest.fn()
    render(
      <LessonCard
        lesson={makeLesson()}
        childName="Adam"
        subjectName="Math"
        onDelete={onDelete}
      />
    )
    expect(screen.getByText('Delete')).toBeInTheDocument()
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

  it('clicking the card title area calls onEdit when onEdit is provided', () => {
    const onEdit = jest.fn()
    render(
      <LessonCard
        lesson={makeLesson({ title: 'Algebra Basics' })}
        childName="Adam"
        subjectName="Math"
        onEdit={onEdit}
      />
    )
    fireEvent.click(screen.getByText('Algebra Basics'))
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'lesson_001' }))
  })

  it('does not crash when card title is clicked and onEdit is not provided', () => {
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
