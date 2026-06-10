import {
  formatCompletionWindow,
  getLessonWindowStart,
  lessonOverlapsRange,
  lessonSpansDate,
} from '@/features/plan/utils/lessonCompletionWindow'

describe('lessonCompletionWindow', () => {
  it('getLessonWindowStart falls back to dueDate when plannedStartDate is null', () => {
    expect(getLessonWindowStart({ dueDate: '2026-05-13' })).toBe('2026-05-13')
  })

  it('lessonOverlapsRange matches legacy dueDate-only lessons', () => {
    expect(lessonOverlapsRange({ dueDate: '2026-05-13' }, '2026-05-11', '2026-05-17')).toBe(true)
    expect(lessonOverlapsRange({ dueDate: '2026-05-10' }, '2026-05-11', '2026-05-17')).toBe(false)
  })

  it('lessonOverlapsRange includes window lessons when range overlaps start or end', () => {
    const windowLesson = { dueDate: '2026-05-15', plannedStartDate: '2026-05-10' }
    expect(lessonOverlapsRange(windowLesson, '2026-05-11', '2026-05-17')).toBe(true)
    expect(lessonOverlapsRange(windowLesson, '2026-05-12', '2026-05-14')).toBe(true)
    expect(lessonOverlapsRange(windowLesson, '2026-05-16', '2026-05-20')).toBe(false)
    expect(lessonOverlapsRange(windowLesson, '2026-05-01', '2026-05-09')).toBe(false)
  })

  it('lessonSpansDate covers each day in the completion window', () => {
    const lesson = { dueDate: '2026-05-13', plannedStartDate: '2026-05-11' }
    expect(lessonSpansDate(lesson, '2026-05-10')).toBe(false)
    expect(lessonSpansDate(lesson, '2026-05-11')).toBe(true)
    expect(lessonSpansDate(lesson, '2026-05-12')).toBe(true)
    expect(lessonSpansDate(lesson, '2026-05-13')).toBe(true)
    expect(lessonSpansDate(lesson, '2026-05-14')).toBe(false)
  })

  it('formatCompletionWindow returns null for single-day lessons', () => {
    expect(formatCompletionWindow({ dueDate: '2026-05-13' })).toBeNull()
    expect(formatCompletionWindow({ dueDate: '2026-05-13', plannedStartDate: '2026-05-13' })).toBeNull()
  })

  it('formatCompletionWindow renders a readable range', () => {
    expect(formatCompletionWindow({ dueDate: '2026-05-13', plannedStartDate: '2026-05-11' })).toBe(
      'May 11 – May 13',
    )
  })
})
