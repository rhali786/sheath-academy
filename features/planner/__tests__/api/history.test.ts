import { getLessons, completeLessonTask, resetStore as resetLessons } from '@/features/planner/server/service'
import { resetStore as resetChildren } from '@/features/children/server/service'
import { resetStore as resetSubjects } from '@/features/subjects/server/service'
import { getCompletedLessonHistory } from '@/features/planner/utils/completedLessonHistory'
import { SEED_IDS } from '@/features/lib/seedIds'

beforeEach(() => {
  resetLessons()
  resetChildren()
  resetSubjects()
})

describe('history route data pipeline (service + utility)', () => {
  it('returns empty array when passed only not-started lessons', () => {
    const notStarted = getLessons().filter(l => l.status === 'not_started')
    const result = getCompletedLessonHistory(notStarted)
    expect(result).toEqual([])
  })

  it('returns completed lesson after marking one complete', () => {
    const all = getLessons()
    const beforeCount = getCompletedLessonHistory(all).length
    const pending = all.find(l => l.status === 'not_started')!
    completeLessonTask(pending.id)
    const lessons = getLessons()
    const result = getCompletedLessonHistory(lessons)
    expect(result).toHaveLength(beforeCount + 1)
    expect(result.some(l => l.id === pending.id)).toBe(true)
  })

  it('filters by childId', () => {
    const adamLessons = getLessons(SEED_IDS.layth)
    completeLessonTask(adamLessons[0].id)
    const lessons = getLessons()
    const result = getCompletedLessonHistory(lessons, { childId: SEED_IDS.layth })
    expect(result.every(l => l.childId === SEED_IDS.layth)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('respects limit option', () => {
    getLessons().forEach(l => completeLessonTask(l.id))
    const lessons = getLessons()
    const result = getCompletedLessonHistory(lessons, { limit: 3 })
    expect(result).toHaveLength(3)
  })

  it('sorts newest first by dueDate', () => {
    getLessons().forEach(l => completeLessonTask(l.id))
    const lessons = getLessons()
    const result = getCompletedLessonHistory(lessons)
    const dates = result.map(l => l.dueDate)
    const sorted = [...dates].sort((a, b) => b.localeCompare(a))
    expect(dates).toEqual(sorted)
  })

  it('showAll returns both completed and pending', () => {
    const all = getLessons()
    completeLessonTask(all[0].id) // mark one complete
    const lessons = getLessons()
    const result = getCompletedLessonHistory(lessons, { showAll: true })
    expect(result.length).toBe(all.length)
  })

  it('filters by subjectId', () => {
    const mathLessons = getLessons(undefined, 'subject_seed_002') // Mathematics
    mathLessons.forEach(l => completeLessonTask(l.id))
    const lessons = getLessons()
    const result = getCompletedLessonHistory(lessons, { subjectId: 'subject_seed_002' })
    expect(result.every(l => l.subjectId === 'subject_seed_002')).toBe(true)
  })
})
