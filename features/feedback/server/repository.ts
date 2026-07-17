import { desc, eq, and, isNotNull, getTableColumns, inArray } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { userFeedback, households, changelogEntries } from '@/db/schema'
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

// Screenshot size cap enforced primarily at the API boundary (features/feedback/api/routes/submit.ts);
// re-checked here as a defensive backstop so no caller can bypass it directly through the repository.
export const MAX_FEEDBACK_SCREENSHOT_BYTES = 2 * 1024 * 1024 // ~2MB
export const ALLOWED_FEEDBACK_SCREENSHOT_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

export interface InsertFeedbackInput extends FeedbackSubmitInput {
  id: string
  userId: string | null
  householdId: string | null
  userEmail: string
  /** Decoded screenshot bytes. Caller (API route) is responsible for base64-decoding. */
  screenshotData?: Buffer | null
}

export interface FeedbackScreenshot {
  data: Buffer
  mimeType: string
  userId: string | null
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
    hasScreenshot: r.screenshot != null,
    status: (r.status ?? 'submitted') as FeedbackStatus,
    featureArea: r.featureArea ?? null,
    feedbackType: (r.feedbackType ?? null) as FeedbackType | null,
    riskLevel: (r.riskLevel ?? null) as FeedbackRiskLevel | null,
    confidence: (r.confidence ?? null) as FeedbackConfidence | null,
    recommendation: r.recommendation ?? null,
    duplicateOfFeedbackId: r.duplicateOfFeedbackId ?? null,
    adminApprovedAt: r.adminApprovedAt ? r.adminApprovedAt.toISOString() : null,
    adminApprovedByUserId: r.adminApprovedByUserId ?? null,
    prNumber: r.prNumber ?? null,
    previewUrl: r.previewUrl ?? null,
    uatInstructions: r.uatInstructions ?? null,
    versionResolved: r.versionResolved ?? null,
    resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
    changelogEntryId: r.changelogEntryId ?? null,
  }
}

export async function insertFeedback(input: InsertFeedbackInput): Promise<void> {
  if (input.screenshotData) {
    if (input.screenshotData.length > MAX_FEEDBACK_SCREENSHOT_BYTES) {
      throw new Error(
        `Screenshot size ${input.screenshotData.length} exceeds limit of ${MAX_FEEDBACK_SCREENSHOT_BYTES} bytes`,
      )
    }
    if (!input.screenshotMimeType || !ALLOWED_FEEDBACK_SCREENSHOT_MIME_TYPES.has(input.screenshotMimeType)) {
      throw new Error(`Screenshot MIME type ${input.screenshotMimeType ?? '(none)'} is not an allowed image type`)
    }
  }

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
    screenshot: input.screenshotData ?? null,
    screenshotMimeType: input.screenshotData ? (input.screenshotMimeType ?? null) : null,
  })
}

/** Fetches just the screenshot bytes + owner for a feedback row, for the download route. Never used by list views. */
export async function getFeedbackScreenshot(id: string): Promise<FeedbackScreenshot | null> {
  const db = getDb()
  const rows = await db
    .select({
      screenshot: userFeedback.screenshot,
      screenshotMimeType: userFeedback.screenshotMimeType,
      userId: userFeedback.userId,
    })
    .from(userFeedback)
    .where(eq(userFeedback.id, id))
    .limit(1)

  const row = rows[0]
  if (!row || !row.screenshot || !row.screenshotMimeType) return null
  return { data: row.screenshot, mimeType: row.screenshotMimeType, userId: row.userId }
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
    .select({
      ...getTableColumns(userFeedback),
      householdName: households.name,
      changelogEntryLabel: changelogEntries.label,
      changelogEntryUserCredit: changelogEntries.userCredit,
    })
    .from(userFeedback)
    .leftJoin(households, eq(userFeedback.householdId, households.id))
    .leftJoin(changelogEntries, eq(userFeedback.changelogEntryId, changelogEntries.id))
    .where(eq(userFeedback.id, id))
    .limit(1)

  if (!rows[0]) return null
  const { householdName, changelogEntryLabel, changelogEntryUserCredit, ...feedbackCols } = rows[0]
  const base = rowToFeedbackRow(feedbackCols, householdName ?? null)
  return {
    ...base,
    changelogEntryLabel: changelogEntryLabel ?? null,
    changelogEntryUserCredit: changelogEntryUserCredit ?? null,
  }
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
  const update = {} as Partial<typeof userFeedback.$inferInsert>
  if (data.status !== undefined) update.status = data.status
  if (data.featureArea !== undefined) update.featureArea = data.featureArea
  if (data.feedbackType !== undefined) update.feedbackType = data.feedbackType
  if (data.riskLevel !== undefined) update.riskLevel = data.riskLevel
  if (data.confidence !== undefined) update.confidence = data.confidence
  if (data.recommendation !== undefined) update.recommendation = data.recommendation
  if (data.duplicateOfFeedbackId !== undefined) update.duplicateOfFeedbackId = data.duplicateOfFeedbackId
  await db.update(userFeedback).set(update).where(eq(userFeedback.id, id))
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
  if (data.changelogEntryId !== undefined) update.changelogEntryId = data.changelogEntryId
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

export async function listUnclassifiedFeedback(options: { ids?: string[] } = {}): Promise<FeedbackRow[]> {
  const db = getDb()
  const conditions = [eq(userFeedback.status, 'submitted')]
  if (options.ids && options.ids.length > 0) {
    conditions.push(inArray(userFeedback.id, options.ids))
  }
  const rows = await db
    .select()
    .from(userFeedback)
    .where(and(...conditions))
    .orderBy(desc(userFeedback.createdAt))
  return rows.map(r => rowToFeedbackRow(r))
}

export async function deleteFeedbackByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const db = getDb()
  await db.delete(userFeedback).where(inArray(userFeedback.id, ids))
}
