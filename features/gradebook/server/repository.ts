import { eq, and } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { learners, subjects, scores, gradingScales, aggregationRules, schoolYears } from '@/db/schema'
import { aggregateScore, gradeFromBands, computeGpaFromPoints, decayStatus } from './aggregation'
import type {
  GradebookSummary,
  Score,
  ScoreState,
  ScoreSource,
  SubjectGradeResult,
  GradingScale,
  GradingScaleBand,
  AggregationRule,
  AggregationStrategy,
} from '@/features/gradebook/types'
import type { GradeBand } from '@/features/gradebook/types'

export type ScoreRow = typeof scores.$inferSelect
export type GradingScaleRow = typeof gradingScales.$inferSelect
export type AggregationRuleRow = typeof aggregationRules.$inferSelect

function rowToGradingScale(row: GradingScaleRow): GradingScale {
  return {
    id: row.id,
    householdId: row.householdId,
    name: row.name,
    bands: (row.bands as GradingScaleBand[]) ?? [],
  }
}

function rowToAggregationRule(row: AggregationRuleRow): AggregationRule {
  return {
    id: row.id,
    householdId: row.householdId,
    name: row.name,
    strategy: row.strategy as AggregationStrategy,
  }
}

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
    lessonTaskId: row.lessonTaskId ?? undefined,
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

  // NOTE: subjects is queried unfiltered here (all school years, all
  // isActive states) and then scoped in-memory below to the active school
  // year, mirroring the filtering features/subjects/server/repository.ts's
  // listSubjectRows already applies. This keeps the existing Promise.all
  // call order/shape stable (learners, subjects, scores, gradingScales,
  // aggregationRules) for callers/tests that mock getDb() sequentially, and
  // adds the active-school-year lookup as a 6th, final parallel query.
  const [learnerRows, subjectRows, allScoreRows, scaleRows, ruleRows, activeYearRows] = await Promise.all([
    db.select().from(learners).where(eq(learners.householdId, householdId)),
    db.select().from(subjects).where(eq(subjects.householdId, householdId)),
    db.select().from(scores).where(eq(scores.householdId, householdId)),
    db.select().from(gradingScales).where(eq(gradingScales.householdId, householdId)),
    db.select().from(aggregationRules).where(eq(aggregationRules.householdId, householdId)),
    db.select().from(schoolYears).where(and(eq(schoolYears.householdId, householdId), eq(schoolYears.isActive, true))),
  ])

  // Scope subjects to the active school year the same way listSubjectRows
  // does: isActive rows only, and — when a school year is active — either
  // matching that year or having no year at all (legacy rows). A course
  // rolled over into a new year keeps its source-year row (isActive stays
  // true, per the "hide but keep" rollover decision), but that source row's
  // schoolYearId no longer matches the active year, so it is excluded here —
  // this is what keeps rolled-over duplicates out of GPA/needs-attention
  // aggregation below.
  const activeYearId = activeYearRows[0]?.id
  const scopedSubjectRows = subjectRows.filter((s) => {
    if (s.isActive === false) return false
    if (!activeYearId) return true
    return s.schoolYearId === activeYearId || s.schoolYearId === null || s.schoolYearId === undefined
  })

  // Reference maps for the per-subject grading scale + aggregation rule.
  const scaleBands = new Map<string, GradingScaleBand[]>()
  for (const row of scaleRows) scaleBands.set(row.id, (row.bands as GradingScaleBand[]) ?? [])
  const ruleStrategy = new Map<string, AggregationStrategy>()
  for (const row of ruleRows) ruleStrategy.set(row.id, row.strategy as AggregationStrategy)

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

  // creditHours is a numeric column — Drizzle returns it as a string (or null
  // when unset). Fall back to 1 credit so subjects without a configured value
  // still weight evenly.
  const creditHoursFor = (raw: string | null): number => {
    if (raw === null) return 1
    const parsed = parseFloat(raw)
    return Number.isFinite(parsed) ? parsed : 1
  }

  return learnerRows.map(learner => {
    const learnerSubjects = scopedSubjectRows.filter(
      s => s.learnerId === learner.id || s.learnerId === null,
    )

    const gpaEntries: { creditHours: number; points: number }[] = []

    const subjectResults: SubjectGradeResult[] = learnerSubjects.map(sub => {
      const subScores = scoreMap.get(learner.id)?.get(sub.id) ?? []
      const creditHours = creditHoursFor(sub.creditHours)
      const strategy = (sub.aggregationRuleId && ruleStrategy.get(sub.aggregationRuleId)) || 'average'
      const bands = (sub.gradingScaleId && scaleBands.get(sub.gradingScaleId)) || undefined

      const courseConfig = {
        isFormalCourse: sub.isFormalCourse,
        termModel: sub.termModel ?? null,
        gradingScaleId: sub.gradingScaleId ?? null,
        aggregationRuleId: sub.aggregationRuleId ?? null,
      }

      const rep = aggregateScore(subScores, strategy)
      if (rep === null) {
        return {
          subjectId: sub.id,
          label: sub.name,
          pointsAverage: null,
          masteryAverage: null,
          gradeLetter: null,
          creditHours,
          needsReview: false,
          ...courseConfig,
        }
      }

      const { letter, gpaPoints } = gradeFromBands(rep, bands)
      gpaEntries.push({ creditHours, points: gpaPoints })

      return {
        subjectId: sub.id,
        label: sub.name,
        pointsAverage: rep,
        masteryAverage: rep,
        gradeLetter: letter,
        creditHours,
        needsReview: strategy === 'average' ? false : decayStatus(subScores),
        ...courseConfig,
      }
    })

    const gpa = computeGpaFromPoints(gpaEntries)

    const needsAttentionSubjects = subjectResults
      .filter(r => r.needsReview || r.pointsAverage === null)
      .map(r => r.subjectId)

    // Composer-safe "current grade": average of non-null subject masteryAverage
    // values only — never averages in a 0 for unscored subjects. Null (not 0)
    // when the learner has no scored subjects at all.
    const masteryValues = subjectResults
      .map(r => r.masteryAverage)
      .filter((v): v is number => v !== null)
    const overallMastery =
      masteryValues.length > 0
        ? Math.round((masteryValues.reduce((sum, v) => sum + v, 0) / masteryValues.length) * 10) / 10
        : null

    return {
      learnerId: learner.id,
      learnerName: learner.name,
      gradeBand: normalizeGradeBand(learner.gradeLevel),
      subjects: subjectResults,
      gpa,
      needsAttentionSubjects,
      overallMastery,
    }
  })
}

// ─── Grading scales (Phase 6) ───────────────────────────────────────────────────

export async function listGradingScales(householdId: string): Promise<GradingScale[]> {
  const db = getDb()
  const rows = await db.select().from(gradingScales).where(eq(gradingScales.householdId, householdId))
  return rows.map(rowToGradingScale)
}

export async function createGradingScale(
  householdId: string,
  input: { name: string; bands: GradingScaleBand[] },
): Promise<GradingScale> {
  const db = getDb()
  const now = new Date()
  const id = `gradescale_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const [row] = await db
    .insert(gradingScales)
    .values({ id, householdId, name: input.name, bands: input.bands, createdAt: now, updatedAt: now })
    .returning()
  return rowToGradingScale(row)
}

export async function updateGradingScale(
  id: string,
  householdId: string,
  patch: { name?: string; bands?: GradingScaleBand[] },
): Promise<GradingScale | null> {
  const db = getDb()
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (patch.name !== undefined) updates.name = patch.name
  if (patch.bands !== undefined) updates.bands = patch.bands
  const [row] = await db
    .update(gradingScales)
    .set(updates)
    .where(and(eq(gradingScales.id, id), eq(gradingScales.householdId, householdId)))
    .returning()
  return row ? rowToGradingScale(row) : null
}

export async function deleteGradingScale(id: string, householdId: string): Promise<boolean> {
  const db = getDb()
  const removed = await db
    .delete(gradingScales)
    .where(and(eq(gradingScales.id, id), eq(gradingScales.householdId, householdId)))
    .returning({ id: gradingScales.id })
  return removed.length > 0
}

// ─── Aggregation rules (Phase 6) ─────────────────────────────────────────────────

export async function listAggregationRules(householdId: string): Promise<AggregationRule[]> {
  const db = getDb()
  const rows = await db.select().from(aggregationRules).where(eq(aggregationRules.householdId, householdId))
  return rows.map(rowToAggregationRule)
}

export async function createAggregationRule(
  householdId: string,
  input: { name: string; strategy: AggregationStrategy },
): Promise<AggregationRule> {
  const db = getDb()
  const now = new Date()
  const id = `aggrule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const [row] = await db
    .insert(aggregationRules)
    .values({ id, householdId, name: input.name, strategy: input.strategy, createdAt: now, updatedAt: now })
    .returning()
  return rowToAggregationRule(row)
}

export async function updateAggregationRule(
  id: string,
  householdId: string,
  patch: { name?: string; strategy?: AggregationStrategy },
): Promise<AggregationRule | null> {
  const db = getDb()
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (patch.name !== undefined) updates.name = patch.name
  if (patch.strategy !== undefined) updates.strategy = patch.strategy
  const [row] = await db
    .update(aggregationRules)
    .set(updates)
    .where(and(eq(aggregationRules.id, id), eq(aggregationRules.householdId, householdId)))
    .returning()
  return row ? rowToAggregationRule(row) : null
}

export async function deleteAggregationRule(id: string, householdId: string): Promise<boolean> {
  const db = getDb()
  const removed = await db
    .delete(aggregationRules)
    .where(and(eq(aggregationRules.id, id), eq(aggregationRules.householdId, householdId)))
    .returning({ id: aggregationRules.id })
  return removed.length > 0
}
