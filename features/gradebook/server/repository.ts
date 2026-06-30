import { eq, and } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { learners, subjects, scores } from '@/db/schema'
import { computeSubjectGrade, computeGpa } from './aggregation'
import type { GradebookSummary, Score, SubjectGradingConfig, ScoreState, ScoreSource } from '@/features/gradebook/types'
import type { GradeBand } from '@/features/gradebook/types'

export type ScoreRow = typeof scores.$inferSelect

export interface CreateScoreInput {
  learnerId: string
  subjectId?: string
  lessonTaskId?: string
  state: ScoreState
  numericValue: number | null
  source: ScoreSource
  occurredAt: string
  comment?: string
}

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

/** Map a ScoreRow (from Drizzle) to the Score domain interface. */
export function rowToScore(row: ScoreRow): Score {
  return {
    id: row.id,
    subjectId: row.subjectId ?? '',
    learnerId: row.learnerId,
    householdId: row.householdId,
    state: row.state as ScoreState,
    // Drizzle returns numeric columns as strings — convert to number or null
    numericValue: row.numericValue !== null ? parseFloat(row.numericValue) : null,
    source: row.source as ScoreSource,
    // Drizzle returns timestamp columns as Date objects
    occurredAt: row.occurredAt instanceof Date ? row.occurredAt.toISOString() : String(row.occurredAt),
    comment: row.comment ?? undefined,
  }
}

/**
 * Insert a single score row and return it as a ScoreRow.
 */
export async function createScore(householdId: string, input: CreateScoreInput): Promise<ScoreRow> {
  const db = getDb()
  const now = new Date()
  const id = `score_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  const [row] = await db
    .insert(scores)
    .values({
      id,
      householdId,
      learnerId: input.learnerId,
      subjectId: input.subjectId ?? null,
      lessonTaskId: input.lessonTaskId ?? null,
      state: input.state,
      numericValue: input.numericValue !== null ? String(input.numericValue) : null,
      source: input.source,
      occurredAt: new Date(input.occurredAt),
      comment: input.comment ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return row
}

export interface UpdateScoreInput {
  state?: ScoreState
  numericValue?: number | null
  occurredAt?: string
  comment?: string | null
}

/**
 * Patch an existing score, scoped to the owning household.
 * Returns the updated row, or undefined when no row matched (wrong id/household).
 */
export async function updateScore(
  id: string,
  householdId: string,
  patch: UpdateScoreInput,
): Promise<ScoreRow | undefined> {
  const db = getDb()
  const updates: Partial<typeof scores.$inferInsert> = { updatedAt: new Date() }
  if (patch.state !== undefined) updates.state = patch.state
  if (patch.numericValue !== undefined) {
    updates.numericValue = patch.numericValue !== null ? String(patch.numericValue) : null
  }
  if (patch.occurredAt !== undefined) updates.occurredAt = new Date(patch.occurredAt)
  if (patch.comment !== undefined) updates.comment = patch.comment

  const [row] = await db
    .update(scores)
    .set(updates)
    .where(and(eq(scores.id, id), eq(scores.householdId, householdId)))
    .returning()

  return row
}

/**
 * Hard-delete a score, scoped to the owning household.
 * Returns true when a row was removed, false otherwise.
 */
export async function deleteScore(id: string, householdId: string): Promise<boolean> {
  const db = getDb()
  const removed = await db
    .delete(scores)
    .where(and(eq(scores.id, id), eq(scores.householdId, householdId)))
    .returning({ id: scores.id })
  return removed.length > 0
}

/**
 * Returns scores for a specific learner + subject.
 */
export async function listScores(
  householdId: string,
  learnerId: string,
  subjectId: string,
): Promise<Score[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(scores)
    .where(
      and(
        eq(scores.householdId, householdId),
        eq(scores.learnerId, learnerId),
        eq(scores.subjectId, subjectId),
      ),
    )
  return rows.map(rowToScore)
}

/**
 * Returns GradebookSummary for every active learner in the household.
 * Fetches all scores for the household in one query, then groups by learner+subject.
 */
export async function listGradebookSummaries(householdId: string): Promise<GradebookSummary[]> {
  const db = getDb()

  const [learnerRows, subjectRows, allScoreRows] = await Promise.all([
    db.select().from(learners).where(eq(learners.householdId, householdId)),
    db.select().from(subjects).where(eq(subjects.householdId, householdId)),
    db.select().from(scores).where(eq(scores.householdId, householdId)),
  ])

  // Build a Map<learnerId, Map<subjectId, Score[]>> for efficient lookup
  const scoreMap = new Map<string, Map<string, Score[]>>()
  for (const row of allScoreRows) {
    const score = rowToScore(row)
    if (!scoreMap.has(score.learnerId)) {
      scoreMap.set(score.learnerId, new Map())
    }
    const subMap = scoreMap.get(score.learnerId)!
    const key = score.subjectId || ''
    if (!subMap.has(key)) subMap.set(key, [])
    subMap.get(key)!.push(score)
  }

  return learnerRows.map(learner => {
    const learnerSubjects = subjectRows.filter(
      s => s.learnerId === learner.id || s.learnerId === null,
    )

    // creditHours is a numeric column — Drizzle returns it as a string (or null
    // when unset). Fall back to 1 credit so subjects without a configured value
    // still weight evenly. (Phase 0: stop hardcoding 1 across the board.)
    const creditHoursFor = (raw: string | null): number => {
      if (raw === null) return 1
      const parsed = parseFloat(raw)
      return Number.isFinite(parsed) ? parsed : 1
    }

    const subjectResults = learnerSubjects.map(sub => {
      const subScores = scoreMap.get(learner.id)?.get(sub.id) ?? []
      return computeSubjectGrade(sub.id, sub.name, subScores, creditHoursFor(sub.creditHours))
    })

    const config: SubjectGradingConfig[] = learnerSubjects.map(sub => ({
      subjectId: sub.id,
      label: sub.name,
      creditHours: creditHoursFor(sub.creditHours),
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
