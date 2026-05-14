/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { LessonTaskList } from '@/features/lesson-tasks/front/components/LessonTaskList'
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

const subject1: SubjectCourse = {
  id: 'subj_1',
  childId: 'child_1',
  name: 'Mathematics',
  category: 'Math',
  isActive: true,
  order: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const sampleTask: LessonTask = {
  id: 'task_1',
  childId: 'child_1',
  subjectId: 'subj_1',
  title: 'Fractions worksheet',
  date: '2026-05-12',
  status: 'not_started',
  notes: 'Complete all exercises carefully',
  resourceLink: 'https://example.com/math',
  createdAt: '2026-05-11T07:00:00.000Z',
  updatedAt: '2026-05-11T07:00:00.000Z',
}

describe('LessonTaskList — Empty', () => {
  it('shows empty state copy', () => {
    render(
      <LessonTaskList
        lessonTasks={[]}
        children={[child1]}
        subjects={[subject1]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    )
    expect(screen.getByText(/no lessons yet/i)).toBeInTheDocument()
  })
})

describe('LessonTaskList — Populated', () => {
  it('renders title, child name, subject name, date, status badge', () => {
    render(
      <LessonTaskList
        lessonTasks={[sampleTask]}
        children={[child1]}
        subjects={[subject1]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    )
    expect(screen.getByText('Fractions worksheet')).toBeInTheDocument()
    expect(screen.getByText('Adam')).toBeInTheDocument()
    expect(screen.getByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByText(/May 12/i)).toBeInTheDocument()
    expect(screen.getByText(/not started/i)).toBeInTheDocument()
  })

  it('renders notes excerpt', () => {
    render(
      <LessonTaskList
        lessonTasks={[sampleTask]}
        children={[child1]}
        subjects={[subject1]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    )
    expect(screen.getByText(/Complete all exercises carefully/i)).toBeInTheDocument()
  })

  it('renders resource link as safe anchor (rel=noopener, target=_blank)', () => {
    render(
      <LessonTaskList
        lessonTasks={[sampleTask]}
        children={[child1]}
        subjects={[subject1]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    )
    const link = screen.getByRole('link', { name: /example\.com/i })
    expect(link).toHaveAttribute('href', 'https://example.com/math')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders safely when notes and resourceLink are undefined', () => {
    const taskNoOptionals: LessonTask = { ...sampleTask, notes: undefined, resourceLink: undefined }
    render(
      <LessonTaskList
        lessonTasks={[taskNoOptionals]}
        children={[child1]}
        subjects={[subject1]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    )
    expect(screen.getByText('Fractions worksheet')).toBeInTheDocument()
  })
})

describe('LessonTaskList — Edit/Delete', () => {
  it('Edit button calls onEdit with the lesson task', () => {
    const onEdit = jest.fn()
    render(
      <LessonTaskList
        lessonTasks={[sampleTask]}
        children={[child1]}
        subjects={[subject1]}
        onEdit={onEdit}
        onDelete={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith(sampleTask)
  })

  it('Delete button with confirmation calls onDelete', () => {
    const onDelete = jest.fn()
    render(
      <LessonTaskList
        lessonTasks={[sampleTask]}
        children={[child1]}
        subjects={[subject1]}
        onEdit={jest.fn()}
        onDelete={onDelete}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    // Confirmation should appear
    fireEvent.click(screen.getByRole('button', { name: /yes/i }))
    expect(onDelete).toHaveBeenCalledWith('task_1')
  })
})
