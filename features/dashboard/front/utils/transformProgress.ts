import type { SubjectProgressSummary } from '@/features/plan/utils/progressBySubject'

export type ProgressData = Record<string, { subjects: Array<{ subject: string; completion: number }> }>

export function transformPlannerProgress(summaries: SubjectProgressSummary[]): ProgressData {
  const result: ProgressData = {}
  for (const s of summaries) {
    if (!result[s.childId]) result[s.childId] = { subjects: [] }
    result[s.childId].subjects.push({
      subject: s.subjectName,
      completion: Math.round(s.completionRate * 100),
    })
  }
  return result
}

export function getAcademicYearRange(): { start: string; end: string } {
  const now = new Date()
  const month = now.getMonth() + 1
  const academicYear = month >= 8 ? now.getFullYear() : now.getFullYear() - 1
  return { start: `${academicYear}-08-01`, end: `${academicYear + 1}-07-31` }
}
