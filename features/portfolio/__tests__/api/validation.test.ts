/** @jest-environment node */

import { validateEvidenceInput } from '@/features/portfolio/server/validation'
import type { ValidationDeps } from '@/features/portfolio/server/validation'
import type { CreateEvidenceItemInput } from '@/features/portfolio/types'

const mockDeps: ValidationDeps = {
  getStudentProfile: (id) => (id === 'child_a' ? { id: 'child_a' } : null),
  getSubject: (id) => (id === 'sub_a' ? { id: 'sub_a', childId: 'child_a' } : null),
  getLessonTask: (id) =>
    id === 'lesson_a' ? { id: 'lesson_a', childId: 'child_a' } : undefined,
}

function validInput(overrides: Partial<CreateEvidenceItemInput> = {}): CreateEvidenceItemInput {
  return {
    title: 'My Evidence',
    childId: 'child_a',
    subjectId: 'sub_a',
    date: '2026-05-12',
    type: 'note',
    notes: 'Good work today',
    ...overrides,
  }
}

describe('validateEvidenceInput', () => {
  it('accepts a fully valid input', () => {
    const errors = validateEvidenceInput(validInput(), mockDeps)
    expect(errors).toHaveLength(0)
  })

  it('rejects blank title', () => {
    const errors = validateEvidenceInput(validInput({ title: '   ' }), mockDeps)
    expect(errors.some(e => e.field === 'title')).toBe(true)
  })

  it('rejects title longer than 120 characters', () => {
    const errors = validateEvidenceInput(validInput({ title: 'a'.repeat(121) }), mockDeps)
    expect(errors.some(e => e.field === 'title')).toBe(true)
  })

  it('accepts title of exactly 120 characters', () => {
    const errors = validateEvidenceInput(validInput({ title: 'a'.repeat(120) }), mockDeps)
    expect(errors.some(e => e.field === 'title')).toBe(false)
  })

  it('rejects unknown childId', () => {
    const errors = validateEvidenceInput(validInput({ childId: 'unknown_child' }), mockDeps)
    expect(errors.some(e => e.field === 'childId')).toBe(true)
  })

  it('rejects unknown subjectId', () => {
    const errors = validateEvidenceInput(validInput({ subjectId: 'unknown_sub' }), mockDeps)
    expect(errors.some(e => e.field === 'subjectId')).toBe(true)
  })

  it('rejects subjectId belonging to a different child', () => {
    const deps: ValidationDeps = {
      ...mockDeps,
      getSubject: (id) => (id === 'sub_b' ? { id: 'sub_b', childId: 'child_b' } : null),
    }
    const errors = validateEvidenceInput(validInput({ subjectId: 'sub_b' }), deps)
    expect(errors.some(e => e.field === 'subjectId')).toBe(true)
  })

  it('rejects invalid date format', () => {
    const errors = validateEvidenceInput(validInput({ date: '12/05/2026' }), mockDeps)
    expect(errors.some(e => e.field === 'date')).toBe(true)
  })

  it('rejects partial date string', () => {
    const errors = validateEvidenceInput(validInput({ date: '2026-5-1' }), mockDeps)
    expect(errors.some(e => e.field === 'date')).toBe(true)
  })

  it('rejects invalid EvidenceType', () => {
    const errors = validateEvidenceInput(
      validInput({ type: 'invalid_type' as any }),
      mockDeps
    )
    expect(errors.some(e => e.field === 'type')).toBe(true)
  })

  it('rejects URL with javascript: protocol', () => {
    const errors = validateEvidenceInput(
      validInput({ url: 'javascript:alert(1)', type: 'link' }),
      mockDeps
    )
    expect(errors.some(e => e.field === 'url')).toBe(true)
  })

  it('rejects URL with file: protocol', () => {
    const errors = validateEvidenceInput(
      validInput({ url: 'file:///etc/passwd', type: 'link' }),
      mockDeps
    )
    expect(errors.some(e => e.field === 'url')).toBe(true)
  })

  it('rejects URL with data: protocol', () => {
    const errors = validateEvidenceInput(
      validInput({ url: 'data:text/html,<h1>hi</h1>', type: 'link' }),
      mockDeps
    )
    expect(errors.some(e => e.field === 'url')).toBe(true)
  })

  it('rejects link type without URL', () => {
    const errors = validateEvidenceInput(
      validInput({ type: 'link', url: undefined }),
      mockDeps
    )
    expect(errors.some(e => e.field === 'url')).toBe(true)
  })

  it('accepts link type with https URL', () => {
    const errors = validateEvidenceInput(
      validInput({ type: 'link', url: 'https://example.com', notes: undefined }),
      mockDeps
    )
    expect(errors).toHaveLength(0)
  })

  it('accepts link type with http URL', () => {
    const errors = validateEvidenceInput(
      validInput({ type: 'link', url: 'http://example.com', notes: undefined }),
      mockDeps
    )
    expect(errors).toHaveLength(0)
  })

  it('rejects note type without notes and without url', () => {
    const errors = validateEvidenceInput(
      validInput({ type: 'note', notes: undefined, url: undefined }),
      mockDeps
    )
    expect(errors.some(e => e.field === 'notes')).toBe(true)
  })

  it('accepts note type with only url (no notes)', () => {
    const errors = validateEvidenceInput(
      validInput({ type: 'note', notes: undefined, url: 'https://example.com' }),
      mockDeps
    )
    expect(errors).toHaveLength(0)
  })

  it('accepts note type with notes (no url)', () => {
    const errors = validateEvidenceInput(
      validInput({ type: 'note', notes: 'Some notes', url: undefined }),
      mockDeps
    )
    expect(errors).toHaveLength(0)
  })

  it('rejects lessonTaskId belonging to a different child', () => {
    const deps: ValidationDeps = {
      ...mockDeps,
      getLessonTask: (id) =>
        id === 'lesson_b' ? { id: 'lesson_b', childId: 'child_b' } : undefined,
    }
    const errors = validateEvidenceInput(validInput({ lessonTaskId: 'lesson_b' }), deps)
    expect(errors.some(e => e.field === 'lessonTaskId')).toBe(true)
  })

  it('rejects unknown lessonTaskId', () => {
    const errors = validateEvidenceInput(
      validInput({ lessonTaskId: 'nonexistent_lesson' }),
      mockDeps
    )
    expect(errors.some(e => e.field === 'lessonTaskId')).toBe(true)
  })

  it('accepts valid lessonTaskId for same child', () => {
    const errors = validateEvidenceInput(
      validInput({ lessonTaskId: 'lesson_a' }),
      mockDeps
    )
    expect(errors).toHaveLength(0)
  })

  it('accepts all optional fields absent for writing_sample type', () => {
    const errors = validateEvidenceInput(
      {
        title: 'Writing Sample',
        childId: 'child_a',
        subjectId: 'sub_a',
        date: '2026-05-12',
        type: 'writing_sample',
      },
      mockDeps
    )
    expect(errors).toHaveLength(0)
  })
})
