import { eq } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { learners, subjects } from '@/db/schema'
import { computeSubjectGrade, computeGpa } from './aggregation'
import type { GradebookSummary, Score, SubjectGradingConfig, NeedsAttentionItem } from '@/features/gradebook/types'
import type { GradeBand } from '@/features/gradebook/types'

function normalizeGradeBand(gradeLevel: string | null): GradeBand {
  if (!gradeLevel) return 'g5_8'
  const lower = gradeLevel.toLowerCase()
  const num = parseInt(lower.replace(/\D/g, ''), 10)
  if (isNaN(num)) {
    if (lower.includes('k') || lower.includes('pre')) return 'g1_4'
    return 'g5_8'
  }
  if (num <= 4) return 'g1_4'
  if (num <= 8) return 'g5_8'
  return 'g9_12'
}

/**
 * Returns GradebookSummary for every active learner in the household.
 * In Layer 2, scores are empty (scores table created in Layer 3); the
 * aggregation module returns null averages/GPA for learners with no scores.
 */
export async function listGradebookSummaries(householdId: string): Promise<GradebookSummary[]> {
  const db = getDb()

  const learnerRows = await db
    .select()
    .from(learners)
    .where(eq(learners.householdId, householdId))

  const subjectRows = await db
    .select()
    .from(subjects)
    .where(eq(subjects.householdId, householdId))

  return learnerRows.map(learner => {
    const learnerSubjects = subjectRows.filter(
      s => s.learnerId === learner.id || s.learnerId === null,
    )

    const scores: Score[] = []

    const subjectResults = learnerSubjects.map(sub =>
      computeSubjectGrade(sub.id, sub.name, scores),
    )

    const config: SubjectGradingConfig[] = learnerSubjects.map(sub => ({
      subjectId: sub.id,
      label: sub.name,
      creditHours: 1,
    }))

    const gradeMap = new Map<string, number>()
    subjectResults.forEach(r => {
      if (r.pointsAverage !== null) gradeMap.set(r.subjectId, r.pointsAverage)
    })

    const gpa = computeGpa(config, gradeMap)

    const needsAttentionSubjects = subjectResults
      .filter(r => r.needsReview || r.pointsAverage === null)
      .map(r => r.subjectId)

    return {
      learnerId: learner.id,
      learnerName: learner.name,
      gradeBand: normalizeGradeBand(learner.gradeLevel),
      subjects: subjectResults,
      gpa,
      needsAttentionSubjects,
    }
  })
}

/**
 * Returns scores for a specific learner + subject.
 * Scores table does not exist in Layer 2; returns empty array.
 * Layer 3 swaps this to a real Drizzle query against the scores table.
 */
export async function listScores(
  _householdId: string,
  _learnerId: string,
  _subjectId: string,
): Promise<Score[]> {
  return []
}
