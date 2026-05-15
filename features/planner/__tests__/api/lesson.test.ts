import { getLessonTask, createLessonTask, updateLessonTask, completeLessonTask, resetStore } from '@/features/planner/server/service'
import { SEED_IDS } from '@/features/lib/seedIds'

beforeEach(() => {
  resetStore()
})

describe('GET /api/planner/lessons/:id', () => {
  it('returns the lesson by id', () => {
    const lesson = getLessonTask('lesson_seed_001')
    expect(lesson).toBeDefined()
    expect(lesson?.id).toBe('lesson_seed_001')
    expect(lesson?.title).toBe('Math Lesson 1 - Fractions')
  })

  it('returns 404 when id does not exist', () => {
    const lesson = getLessonTask('non_existent_id')
    expect(lesson).toBeUndefined()
  })
})

describe('POST /api/planner/lessons', () => {
  it('creates a lesson with valid childId and subjectId', () => {
    const lesson = createLessonTask({
      childId: SEED_IDS.adam,
      subjectId: 'subject_seed_002',
      householdId: SEED_IDS.household,
      title: 'New Math Lesson',
      description: 'Test lesson',
      dueDate: '2026-05-15',
      status: 'not_started' as const,
      order: 1,
    })

    expect(lesson).not.toBeNull()
    expect(lesson?.title).toBe('New Math Lesson')
    expect(lesson?.childId).toBe(SEED_IDS.adam)
  })

  it('returns null when childId does not exist in children service', () => {
    const lesson = createLessonTask({
      childId: 'non_existent_child',
      subjectId: 'subject_seed_002',
      householdId: SEED_IDS.household,
      title: 'New Lesson',
      dueDate: '2026-05-15',
      status: 'not_started' as const,
      order: 1,
    })

    expect(lesson).toBeNull()
  })

  it('returns null when subjectId does not exist in subjects service', () => {
    const lesson = createLessonTask({
      childId: SEED_IDS.adam,
      subjectId: 'non_existent_subject',
      householdId: SEED_IDS.household,
      title: 'New Lesson',
      dueDate: '2026-05-15',
      status: 'not_started' as const,
      order: 1,
    })

    expect(lesson).toBeNull()
  })
})

describe('PUT /api/planner/lessons/:id', () => {
  it('updates lesson fields (title, description, dueDate)', () => {
    const updated = updateLessonTask('lesson_seed_001', {
      title: 'Updated Math Lesson',
      description: 'Updated description',
      dueDate: '2026-05-20',
    })

    expect(updated).not.toBeNull()
    expect(updated?.title).toBe('Updated Math Lesson')
    expect(updated?.description).toBe('Updated description')
    expect(updated?.dueDate).toBe('2026-05-20')
  })

  it('returns null when id does not exist', () => {
    const updated = updateLessonTask('non_existent_id', {
      title: 'Updated Title',
    })

    expect(updated).toBeNull()
  })
})

describe('PATCH /api/planner/lessons/:id/complete', () => {
  it('sets status to completed', () => {
    const completed = completeLessonTask('lesson_seed_001')

    expect(completed).not.toBeNull()
    expect(completed?.status).toBe('completed')
  })

  it('returns null when id does not exist', () => {
    const completed = completeLessonTask('non_existent_id')

    expect(completed).toBeNull()
  })
})
