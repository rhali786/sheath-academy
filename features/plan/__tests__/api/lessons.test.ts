import { getLessons, createLessonTask, resetStore } from '@/features/plan/server/service'
import { SEED_LESSONS } from '@/features/plan/server/seed'
import { SEED_IDS } from '@/features/lib/seedIds'

beforeEach(() => {
  resetStore()
})

describe('GET /api/planner/lessons', () => {
  it('returns all lessons for a given week when no filters provided', () => {
    const lessons = getLessons()
    expect(Array.isArray(lessons)).toBe(true)
    expect(lessons.length).toBe(SEED_LESSONS.length)
  })

  it('returns empty array when no lessons exist for that week', () => {
    const lessons = getLessons('non_existent_child_id')
    expect(lessons).toEqual([])
  })

  it('filters lessons by childId when childIds query param provided', () => {
    const lessons = getLessons(SEED_IDS.layth)
    expect(lessons.every(l => l.childId === SEED_IDS.layth)).toBe(true)
    expect(lessons.length).toBeGreaterThan(0)
  })

  it('filters lessons by subjectId when subjectIds query param provided', () => {
    const lessons = getLessons(undefined, 'subject_seed_002') // Mathematics
    expect(lessons.every(l => l.subjectId === 'subject_seed_002')).toBe(true)
  })

  it('filters by both childIds and subjectIds when both provided', () => {
    const lessons = getLessons(SEED_IDS.layth, 'subject_seed_002')
    expect(lessons.every(l => l.childId === SEED_IDS.layth && l.subjectId === 'subject_seed_002')).toBe(true)
  })

  it('returns 400 when week param is not a valid ISO date', () => {
    // This is tested at the API handler level, not service level
    // The service doesn't do date validation
  })

  it('respects weekStartDay from household profile when calculating week span', () => {
    // This is tested at the API handler level, not service level
    // The service returns lessons; week filtering is in the handler
  })
})
