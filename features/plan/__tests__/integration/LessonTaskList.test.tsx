import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { LessonTaskList } from '@/features/plan/front/components/LessonTaskList'
import type { LessonTask } from '@/features/plan/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

const mockChildren: StudentProfile[] = [
  { id: 'child_001', householdId: 'hh_001', name: 'Adam', gradeLabel: '5th', isActive: true, username: 'adam', password: 'pw', createdAt: '2026-01-01T00:00:00Z' },
]

const mockSubjects: SubjectCourse[] = [
  { id: 'subj_001', childId: 'child_001', name: 'Mathematics', category: 'Math', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
]

const baseLesson: LessonTask = {
  id: 'lesson_001',
  childId: 'child_001',
  subjectId: 'subj_001',
  householdId: 'hh_001',
  title: 'Math Practice',
  dueDate: '2026-05-12',
  status: 'not_started',
  order: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('LessonTaskList', () => {
  it('shows empty state when lessons array is empty', () => {
    render(
      <LessonTaskList
        lessons={[]}
        children={mockChildren}
        subjects={mockSubjects}
      />
    )
    expect(screen.getByText(/no lessons yet/i)).toBeInTheDocument()
  })

  it('shows error state when error prop is provided', () => {
    render(
      <LessonTaskList
        lessons={[]}
        children={mockChildren}
        subjects={mockSubjects}
        error="Network error"
      />
    )
    expect(screen.getByText(/could not load lessons/i)).toBeInTheDocument()
  })

  it('renders lesson title', () => {
    render(
      <LessonTaskList
        lessons={[baseLesson]}
        children={mockChildren}
        subjects={mockSubjects}
      />
    )
    expect(screen.getByText('Math Practice')).toBeInTheDocument()
  })

  it('shows resolved child name, not raw childId', () => {
    render(
      <LessonTaskList
        lessons={[baseLesson]}
        children={mockChildren}
        subjects={mockSubjects}
      />
    )
    expect(screen.getByText(/Adam/)).toBeInTheDocument()
    expect(screen.queryByText('child_001')).not.toBeInTheDocument()
  })

  it('shows resolved subject name, not raw subjectId', () => {
    render(
      <LessonTaskList
        lessons={[baseLesson]}
        children={mockChildren}
        subjects={mockSubjects}
      />
    )
    expect(screen.getByText(/Mathematics/)).toBeInTheDocument()
    expect(screen.queryByText('subj_001')).not.toBeInTheDocument()
  })

  it('formats dueDate as readable date (e.g. May 12)', () => {
    render(
      <LessonTaskList
        lessons={[baseLesson]}
        children={mockChildren}
        subjects={mockSubjects}
      />
    )
    expect(screen.getByText(/May 12/)).toBeInTheDocument()
  })

  it('shows status badge for not_started', () => {
    render(
      <LessonTaskList
        lessons={[baseLesson]}
        children={mockChildren}
        subjects={mockSubjects}
      />
    )
    expect(screen.getByText(/not started/i)).toBeInTheDocument()
  })

  it('shows status badge for completed', () => {
    render(
      <LessonTaskList
        lessons={[{ ...baseLesson, status: 'completed' }]}
        children={mockChildren}
        subjects={mockSubjects}
      />
    )
    expect(screen.getByText(/completed/i)).toBeInTheDocument()
  })

  it('shows status badge for skipped', () => {
    render(
      <LessonTaskList
        lessons={[{ ...baseLesson, status: 'skipped' }]}
        children={mockChildren}
        subjects={mockSubjects}
      />
    )
    expect(screen.getByText(/skipped/i)).toBeInTheDocument()
  })

  it('renders resource link with safe attrs', () => {
    render(
      <LessonTaskList
        lessons={[{ ...baseLesson, resourceLink: 'https://example.com' }]}
        children={mockChildren}
        subjects={mockSubjects}
      />
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('shows description excerpt (max 80 chars)', () => {
    const longDesc = 'A'.repeat(90)
    render(
      <LessonTaskList
        lessons={[{ ...baseLesson, description: longDesc }]}
        children={mockChildren}
        subjects={mockSubjects}
      />
    )
    expect(screen.getByText(/A{80}…/)).toBeInTheDocument()
  })

  it('calls onEdit when Edit button clicked', () => {
    const onEdit = jest.fn()
    render(
      <LessonTaskList
        lessons={[baseLesson]}
        children={mockChildren}
        subjects={mockSubjects}
        onEdit={onEdit}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith(baseLesson)
  })

  it('Delete button shows confirmation before calling onDelete', () => {
    const onDelete = jest.fn()
    render(
      <LessonTaskList
        lessons={[baseLesson]}
        children={mockChildren}
        subjects={mockSubjects}
        onDelete={onDelete}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /yes/i }))
    expect(onDelete).toHaveBeenCalledWith('lesson_001')
  })

  it('Cancel in delete confirmation hides the confirmation', () => {
    const onDelete = jest.fn()
    render(
      <LessonTaskList
        lessons={[baseLesson]}
        children={mockChildren}
        subjects={mockSubjects}
        onDelete={onDelete}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('button', { name: /yes/i })).not.toBeInTheDocument()
    expect(onDelete).not.toHaveBeenCalled()
  })
})
