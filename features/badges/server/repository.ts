import { eq, or, isNull, and, desc } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import {
  badgeDefinitions,
  badgeAwards,
  badgeAwardEvidence,
  badgeSettings,
} from '@/db/schema'
import type {
  BadgeDefinition,
  BadgeAward,
  BadgeAwardEvidence,
  BadgeCollectionItem,
  BadgeSettings,
  BadgeStatus,
  VerificationRequirement,
  BadgeVisibility,
} from '@/features/badges/types'
import type { GradeBand } from '@/features/gradebook/types'

// ─── Row types ────────────────────────────────────────────────────────────────

export type BadgeDefinitionRow = typeof badgeDefinitions.$inferSelect
export type BadgeAwardRow = typeof badgeAwards.$inferSelect

// ─── Row mappers ──────────────────────────────────────────────────────────────

function rowToDefinition(row: BadgeDefinitionRow): BadgeDefinition {
  return {
    id: row.id,
    householdId: row.householdId ?? null,
    title: row.title,
    description: row.description,
    criteria: row.criteria,
    emblemKey: row.emblemKey,
    gradeBands: (row.gradeBands as GradeBand[]) ?? [],
    verificationRequirement: row.verificationRequirement as VerificationRequirement,
    isStarter: row.isStarter,
    enabled: row.enabled,
    visibility: row.visibility as BadgeVisibility,
  }
}

function rowToAward(row: BadgeAwardRow, evidenceIds: string[]): BadgeAward {
  return {
    id: row.id,
    householdId: row.householdId,
    learnerId: row.learnerId,
    badgeId: row.badgeId,
    status: row.status as BadgeStatus,
    submittedAt: row.submittedAt instanceof Date ? row.submittedAt.toISOString() : (row.submittedAt ?? null),
    verifiedAt: row.verifiedAt instanceof Date ? row.verifiedAt.toISOString() : (row.verifiedAt ?? null),
    approvedAt: row.approvedAt instanceof Date ? row.approvedAt.toISOString() : (row.approvedAt ?? null),
    evidenceIds,
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns badge definitions visible to the household:
 * - starter badges (householdId null, platform-wide)
 * - household custom badges (householdId = this household)
 */
export async function listBadgeDefinitions(
  householdId: string,
): Promise<BadgeDefinition[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(badgeDefinitions)
    .where(
      or(
        isNull(badgeDefinitions.householdId),
        eq(badgeDefinitions.householdId, householdId),
      ),
    )
    .orderBy(desc(badgeDefinitions.isStarter), badgeDefinitions.title)
  return rows.map(rowToDefinition)
}

/**
 * Returns the badge collection (definitions + earned state) for a learner.
 * Combines definitions with award data to produce BadgeCollectionItem[].
 */
export async function listBadgeCollection(
  householdId: string,
  learnerId: string,
): Promise<BadgeCollectionItem[]> {
  const [definitions, awards] = await Promise.all([
    listBadgeDefinitions(householdId),
    listBadgeAwards(householdId, learnerId),
  ])

  const awardMap = new Map<string, BadgeAward>()
  for (const award of awards) {
    awardMap.set(award.badgeId, award)
  }

  return definitions.map(definition => {
    const award = awardMap.get(definition.id) ?? null
    return {
      definition,
      award,
      isEarned: award?.approvedAt != null,
    }
  })
}

/**
 * Returns all badge awards for a learner, with evidenceIds populated.
 */
export async function listBadgeAwards(
  householdId: string,
  learnerId: string,
): Promise<BadgeAward[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(badgeAwards)
    .where(
      and(
        eq(badgeAwards.householdId, householdId),
        eq(badgeAwards.learnerId, learnerId),
      ),
    )

  // For each award, fetch evidence IDs
  const results: BadgeAward[] = []
  for (const row of rows) {
    const evidenceRows = await db
      .select()
      .from(badgeAwardEvidence)
      .where(eq(badgeAwardEvidence.badgeAwardId, row.id))
    const evidenceIds = evidenceRows.map(e => e.evidenceId)
    results.push(rowToAward(row, evidenceIds))
  }
  return results
}

/**
 * Returns household badge settings; returns defaults if no row exists.
 */
export async function getBadgeSettings(
  householdId: string,
): Promise<BadgeSettings> {
  const db = getDb()
  const rows = await db
    .select()
    .from(badgeSettings)
    .where(eq(badgeSettings.householdId, householdId))
    .limit(1)
  if (rows.length === 0) {
    return { householdId, platformBadgesEnabled: true }
  }
  return {
    householdId: rows[0].householdId,
    platformBadgesEnabled: rows[0].platformBadgesEnabled,
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Creates a new badge award in 'draft' status (or the provided status).
 */
export async function createAward(
  householdId: string,
  input: { learnerId: string; badgeId: string; status?: BadgeStatus },
): Promise<BadgeAward> {
  const db = getDb()
  const now = new Date()
  const id = `award_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  const [row] = await db
    .insert(badgeAwards)
    .values({
      id,
      householdId,
      learnerId: input.learnerId,
      badgeId: input.badgeId,
      status: input.status ?? 'draft',
      submittedAt: null,
      verifiedAt: null,
      approvedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return rowToAward(row, [])
}

/**
 * Updates a badge award status and optional timestamps.
 * Returns the updated award, or null if not found.
 */
export async function updateAwardStatus(
  id: string,
  householdId: string,
  status: BadgeStatus,
  extra?: {
    submittedAt?: Date | null
    verifiedAt?: Date | null
    approvedAt?: Date | null
  },
): Promise<BadgeAward | null> {
  const db = getDb()
  const now = new Date()

  const rows = await db
    .update(badgeAwards)
    .set({
      status,
      ...(extra?.submittedAt !== undefined ? { submittedAt: extra.submittedAt } : {}),
      ...(extra?.verifiedAt !== undefined ? { verifiedAt: extra.verifiedAt } : {}),
      ...(extra?.approvedAt !== undefined ? { approvedAt: extra.approvedAt } : {}),
      updatedAt: now,
    })
    .where(
      and(
        eq(badgeAwards.id, id),
        eq(badgeAwards.householdId, householdId),
      ),
    )
    .returning()

  if (rows.length === 0) return null

  const evidenceRows = await db
    .select()
    .from(badgeAwardEvidence)
    .where(eq(badgeAwardEvidence.badgeAwardId, id))

  return rowToAward(rows[0], evidenceRows.map(e => e.evidenceId))
}

/**
 * Links a portfolio evidence item to a badge award.
 */
export async function addEvidenceToAward(
  householdId: string,
  input: { badgeAwardId: string; evidenceId: string },
): Promise<BadgeAwardEvidence> {
  const db = getDb()
  const now = new Date()
  const id = `bae_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  const [row] = await db
    .insert(badgeAwardEvidence)
    .values({
      id,
      householdId,
      badgeAwardId: input.badgeAwardId,
      evidenceId: input.evidenceId,
      addedAt: now,
    })
    .returning()

  return {
    id: row.id,
    householdId: row.householdId,
    badgeAwardId: row.badgeAwardId,
    evidenceId: row.evidenceId,
    addedAt: row.addedAt instanceof Date ? row.addedAt.toISOString() : String(row.addedAt),
  }
}

/**
 * Upserts household badge settings.
 */
export async function setBadgeSettings(
  householdId: string,
  input: { platformBadgesEnabled: boolean },
): Promise<void> {
  const db = getDb()
  const now = new Date()

  await db
    .insert(badgeSettings)
    .values({
      householdId,
      platformBadgesEnabled: input.platformBadgesEnabled,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: badgeSettings.householdId,
      set: {
        platformBadgesEnabled: input.platformBadgesEnabled,
        updatedAt: now,
      },
    })
}
