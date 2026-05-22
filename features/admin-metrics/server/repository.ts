import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { usageEvents } from '@/db/schema'
import type { TrackUsageEventInput, UsageEvent } from '@/features/admin-metrics/types'

export type UsageEventRow = typeof usageEvents.$inferSelect

function rowToEvent(row: UsageEventRow): UsageEvent {
  return {
    id: row.id,
    eventType: row.eventType as UsageEvent['eventType'],
    userId: row.userId,
    householdId: row.householdId,
    learnerId: row.learnerId ?? undefined,
    featureArea: row.featureArea as UsageEvent['featureArea'],
    entityType: row.entityType ?? undefined,
    entityId: row.entityId ?? undefined,
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
    occurredAt: row.occurredAt.toISOString(),
  }
}

export async function insertUsageEvent(input: TrackUsageEventInput): Promise<UsageEvent> {
  const db = getDb()
  const now = input.occurredAt ?? new Date()
  const id = `usage_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const inserted = await db
    .insert(usageEvents)
    .values({
      id,
      eventType: input.eventType,
      userId: input.userId,
      householdId: input.householdId,
      learnerId: input.learnerId ?? null,
      featureArea: input.featureArea,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? null,
      occurredAt: now,
    })
    .returning()
  return rowToEvent(inserted[0])
}

export async function listUsageEvents(filters: {
  periodStart: Date
  periodEnd: Date
  householdId?: string
  userId?: string
  featureArea?: string
  eventType?: string
}): Promise<UsageEvent[]> {
  const db = getDb()
  const conditions = [
    gte(usageEvents.occurredAt, filters.periodStart),
    lte(usageEvents.occurredAt, filters.periodEnd),
  ]
  if (filters.householdId) conditions.push(eq(usageEvents.householdId, filters.householdId))
  if (filters.userId) conditions.push(eq(usageEvents.userId, filters.userId))
  if (filters.featureArea) conditions.push(eq(usageEvents.featureArea, filters.featureArea))
  if (filters.eventType) conditions.push(eq(usageEvents.eventType, filters.eventType))

  const rows = await db
    .select()
    .from(usageEvents)
    .where(and(...conditions))
  return rows.map(rowToEvent)
}
