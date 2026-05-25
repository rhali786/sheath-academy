import { desc } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { userFeedback } from '@/db/schema'
import type { FeedbackRow, FeedbackSubmitInput } from '@/features/feedback/types'

export interface InsertFeedbackInput extends FeedbackSubmitInput {
  id: string
  userId: string | null
  householdId: string | null
  userEmail: string
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
  })
}

export async function listFeedback(): Promise<FeedbackRow[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(userFeedback)
    .orderBy(desc(userFeedback.createdAt))

  return rows.map(r => ({
    id: r.id,
    userId: r.userId,
    householdId: r.householdId,
    userEmail: r.userEmail,
    pagePath: r.pagePath,
    sentiment: r.sentiment as FeedbackRow['sentiment'],
    message: r.message,
    createdAt: r.createdAt.toISOString(),
  }))
}
