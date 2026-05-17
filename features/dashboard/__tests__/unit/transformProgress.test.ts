import { transformPlannerProgress } from '@/features/dashboard/front/utils/transformProgress'
import type { SubjectProgressSummary } from '@/features/plan/utils/progressBySubject'

function makeSummary(childId: string, subjectName: string, rate: number): SubjectProgressSummary {
  return {
    childId,
    childName: 'Test Child',
    subjectId: `subj_${subjectName}`,
    subjectName,
    scope: 'year',
    plannedCount: 10,
    completedCount: Math.round(rate * 10),
    pendingCount: Math.round((1 - rate) * 10),
    completionRate: rate,
  }
}

describe('transformPlannerProgress', () => {
  test('transforms a single subject into progressData', () => {
    const summaries = [makeSummary('c1', 'Mathematics', 0.75)]
    const result = transformPlannerProgress(summaries)
    expect(result['c1']).toBeDefined()
    expect(result['c1'].subjects).toEqual([{ subject: 'Mathematics', completion: 75 }])
  })

  test('groups multiple subjects for the same child', () => {
    const summaries = [
      makeSummary('c1', 'Mathematics', 0.75),
      makeSummary('c1', 'Quran Memorisation', 0.50),
    ]
    const result = transformPlannerProgress(summaries)
    expect(result['c1'].subjects).toHaveLength(2)
    expect(result['c1'].subjects.map(s => s.subject)).toContain('Mathematics')
    expect(result['c1'].subjects.map(s => s.subject)).toContain('Quran Memorisation')
  })

  test('separates summaries for different children', () => {
    const summaries = [
      makeSummary('c1', 'Mathematics', 0.80),
      makeSummary('c2', 'Reading', 0.60),
    ]
    const result = transformPlannerProgress(summaries)
    expect(result['c1'].subjects.map(s => s.subject)).toContain('Mathematics')
    expect(result['c2'].subjects.map(s => s.subject)).toContain('Reading')
    expect(result['c1'].subjects.some(s => s.subject === 'Reading')).toBe(false)
    expect(result['c2'].subjects.some(s => s.subject === 'Mathematics')).toBe(false)
  })

  test('rounds completionRate to integer percentage', () => {
    const summaries = [makeSummary('c1', 'Arabic Language', 0.333)]
    const result = transformPlannerProgress(summaries)
    expect(result['c1'].subjects[0].completion).toBe(33)
  })

  test('returns empty object for empty summaries', () => {
    expect(transformPlannerProgress([])).toEqual({})
  })
})
