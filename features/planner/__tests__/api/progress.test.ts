import { getLessons, completeLessonTask, resetStore as resetLessons } from '@/features/planner/server/service'
import { getStudentProfiles, resetStore as resetChildren } from '@/features/children/server/service'
import { getSubjects, resetStore as resetSubjects } from '@/features/subjects/server/service'
import { computeProgressBySubject } from '@/features/planner/utils/progressBySubject'
import { SEED_IDS } from '@/features/lib/seedIds'

const WEEK = { start: '2026-05-11', end: '2026-05-17' }

beforeEach(() => {
  resetLessons()
  resetChildren()
  resetSubjects()
})

function buildNameMaps() {
  const children = getStudentProfiles()
  const subjects = getSubjects()
  const childNames = Object.fromEntries(children.map(c => [c.id, c.name]))
  const subjectNames = Object.fromEntries(subjects.map(s => [s.id, s.name]))
  return { childNames, subjectNames }
}

describe('progress route data pipeline (service + utility)', () => {
  it('returns summaries for lessons in the week range', () => {
    const { childNames, subjectNames } = buildNameMaps()
    const lessons = getLessons()
    const summaries = computeProgressBySubject(lessons, WEEK, null, childNames, subjectNames, 'week')
    expect(summaries.length).toBeGreaterThan(0)
  })

  it('returns empty array when no lessons fall in range', () => {
    const { childNames, subjectNames } = buildNameMaps()
    const lessons = getLessons()
    const summaries = computeProgressBySubject(lessons, { start: '2020-01-01', end: '2020-01-07' }, null, childNames, subjectNames, 'week')
    expect(summaries).toEqual([])
  })

  it('filters by childId', () => {
    const { childNames, subjectNames } = buildNameMaps()
    const lessons = getLessons()
    const summaries = computeProgressBySubject(lessons, WEEK, [SEED_IDS.adam], childNames, subjectNames, 'week')
    expect(summaries.every(s => s.childId === SEED_IDS.adam)).toBe(true)
  })

  it('each summary has expected shape', () => {
    const { childNames, subjectNames } = buildNameMaps()
    const lessons = getLessons()
    const summaries = computeProgressBySubject(lessons, WEEK, null, childNames, subjectNames, 'week')
    const row = summaries[0]
    expect(row).toMatchObject({
      childId: expect.any(String),
      childName: expect.any(String),
      subjectId: expect.any(String),
      subjectName: expect.any(String),
      plannedCount: expect.any(Number),
      completedCount: expect.any(Number),
      pendingCount: expect.any(Number),
      completionRate: expect.any(Number),
      scope: 'week',
    })
  })

  it('completedCount reflects completed lessons', () => {
    const { childNames, subjectNames } = buildNameMaps()
    const adamLessons = getLessons(SEED_IDS.adam)
    completeLessonTask(adamLessons[0].id)
    const lessons = getLessons()
    const summaries = computeProgressBySubject(lessons, WEEK, [SEED_IDS.adam], childNames, subjectNames, 'week')
    const total = summaries.reduce((acc, s) => acc + s.completedCount, 0)
    expect(total).toBe(1)
  })

  it('scope is passed through correctly for year', () => {
    const { childNames, subjectNames } = buildNameMaps()
    const lessons = getLessons()
    const summaries = computeProgressBySubject(lessons, { start: '2025-08-01', end: '2026-05-31' }, null, childNames, subjectNames, 'year')
    expect(summaries.every(s => s.scope === 'year')).toBe(true)
  })
})
