import { desc, eq, and, isNotNull, getTableColumns, inArray } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { userFeedback, households } from '@/db/schema'
import type {
  FeedbackRow,
  FeedbackSubmitInput,
  FeedbackSentiment,
  FeedbackStatus,
  FeedbackType,
  FeedbackRiskLevel,
  FeedbackConfidence,
  FeedbackTriageUpdate,
  FeedbackWorkflowUpdate,
  AdminFeedbackFilters,
} from '@/features/feedback/types'

export interface InsertFeedbackInput extends FeedbackSubmitInput {
  id: string
  userId: string | null
  householdId: string | null
  userEmail: string
}

function rowToFeedbackRow(r: typeof userFeedback.$inferSelect, householdName: string | null = null): FeedbackRow {
  return {
    id: r.id,
    userId: r.userId,
    householdId: r.householdId,
    householdName,
    userEmail: r.userEmail,
    pagePath: r.pagePath,
    sentiment: r.sentiment as FeedbackSentiment,
    message: r.message,
    createdAt: r.createdAt.toISOString(),
    status: (r.status ?? 'submitted') as FeedbackStatus,
    featureArea: r.featureArea ?? null,
    feedbackType: (r.feedbackType ?? null) as FeedbackType | null,
    riskLevel: (r.riskLevel ?? null) as FeedbackRiskLevel | null,
    confidence: (r.confidence ?? null) as FeedbackConfidence | null,
    duplicateOfFeedbackId: r.duplicateOfFeedbackId ?? null,
    adminApprovedAt: r.adminApprovedAt ? r.adminApprovedAt.toISOString() : null,
    adminApprovedByUserId: r.adminApprovedByUserId ?? null,
    prNumber: r.prNumber ?? null,
    previewUrl: r.previewUrl ?? null,
    uatInstructions: r.uatInstructions ?? null,
    versionResolved: r.versionResolved ?? null,
    resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
    changelogVersion: r.changelogVersion ?? null,
    changelogLabel: r.changelogLabel ?? null,
    changelogUserCredit: r.changelogUserCredit ?? null,
  }
}

export async function insertFeedback(input: InsertFeedbackInput): Promise<void> {
  const db = getDb()
  await db.insert(userFeedback).values({
    id: input.id,
    userId: input.userId,
    householdId: input.householdId,
    userEmail: input.userEmail,
    pagePath: input.pagePath,
    sentiment: input.sentiment,
    message: input.message ?? null,
    createdAt: new Date(),
    status: 'submitted',
  })
}

export async function listFeedback(): Promise<FeedbackRow[]> {
  const db = getDb()
  const rows = await db.select().from(userFeedback).orderBy(desc(userFeedback.createdAt))
  return rows.map(r => rowToFeedbackRow(r))
}

export async function listFeedbackByUserId(userId: string): Promise<FeedbackRow[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(userFeedback)
    .where(eq(userFeedback.userId, userId))
    .orderBy(desc(userFeedback.createdAt))
  return rows.map(r => rowToFeedbackRow(r))
}

export async function getFeedbackById(id: string): Promise<FeedbackRow | null> {
  const db = getDb()
  const rows = await db
    .select({ ...getTableColumns(userFeedback), householdName: households.name })
    .from(userFeedback)
    .leftJoin(households, eq(userFeedback.householdId, households.id))
    .where(eq(userFeedback.id, id))
    .limit(1)
  if (!rows[0]) return null
  const { householdName, ...feedbackCols } = rows[0]
  return rowToFeedbackRow(feedbackCols, householdName ?? null)
}

export async function listFeedbackForAdmin(filters: AdminFeedbackFilters = {}): Promise<FeedbackRow[]> {
  const db = getDb()
  const conditions = []

  if (filters.status) conditions.push(eq(userFeedback.status, filters.status))
  if (filters.confidence) conditions.push(eq(userFeedback.confidence, filters.confidence))
  if (filters.riskLevel) conditions.push(eq(userFeedback.riskLevel, filters.riskLevel))
  if (filters.feedbackType) conditions.push(eq(userFeedback.feedbackType, filters.feedbackType))
  if (filters.featureArea) conditions.push(eq(userFeedback.featureArea, filters.featureArea))
  if (filters.prNumber) conditions.push(eq(userFeedback.prNumber, filters.prNumber))
  if (filters.hasDuplicate === true) conditions.push(isNotNull(userFeedback.duplicateOfFeedbackId))

  const rows = await db
    .select()
    .from(userFeedback)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(userFeedback.createdAt))

  return rows.map(r => rowToFeedbackRow(r))
}

export async function updateFeedbackTriage(id: string, data: FeedbackTriageUpdate): Promise<void> {
  const db = getDb()
  await db.update(userFeedback).set(data).where(eq(userFeedback.id, id))
}

export async function updateFeedbackWorkflow(id: string, data: FeedbackWorkflowUpdate): Promise<void> {
  const db = getDb()
  const update = {} as Partial<typeof userFeedback.$inferInsert>
  if (data.status !== undefined) update.status = data.status
  if (data.prNumber !== undefined) update.prNumber = data.prNumber
  if (data.previewUrl !== undefined) update.previewUrl = data.previewUrl
  if (data.uatInstructions !== undefined) update.uatInstructions = data.uatInstructions
  if (data.versionResolved !== undefined) update.versionResolved = data.versionResolved
  if (data.resolvedAt) update.resolvedAt = new Date(data.resolvedAt)
  if (data.changelogVersion !== undefined) update.changelogVersion = data.changelogVersion
  if (data.changelogLabel !== undefined) update.changelogLabel = data.changelogLabel
  if (data.changelogUserCredit !== undefined) update.changelogUserCredit = data.changelogUserCredit
  await db.update(userFeedback).set(update).where(eq(userFeedback.id, id))
}

export async function listFeedbackByPrNumber(prNumber: number): Promise<FeedbackRow[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(userFeedback)
    .where(eq(userFeedback.prNumber, prNumber))
    .orderBy(desc(userFeedback.createdAt))
  return rows.map(r => rowToFeedbackRow(r))
}

export async function recordFeedbackApproval(id: string, adminEmail: string): Promise<void> {
  const db = getDb()
  await db
    .update(userFeedback)
    .set({
      adminApprovedAt: new Date(),
      adminApprovedByUserId: adminEmail,
    })
    .where(eq(userFeedback.id, id))
}

export async function approveFeedback(id: string, adminEmail: string): Promise<void> {
  await recordFeedbackApproval(id, adminEmail)
}

export async function listUnclassifiedFeedback(): Promise<FeedbackRow[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(userFeedback)
    .where(eq(userFeedback.status, 'submitted'))
    .orderBy(desc(userFeedback.createdAt))
  return rows.map(r => rowToFeedbackRow(r))
}
