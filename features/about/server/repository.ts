import { desc, eq } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { changelogEntries } from '@/db/schema'
import type { ChangelogEntry } from '@/features/about/types'

export interface InsertChangelogEntryInput {
  id: string
  version: string
  label: string
  detail: string
  source: 'steward' | 'manual'
  prNumber: number | null
  userCredit: string | null
  status: 'pending' | 'shipped'
}

function rowToEntry(r: typeof changelogEntries.$inferSelect): ChangelogEntry {
  return {
    id: r.id,
    version: r.version,
    label: r.label,
    detail: r.detail,
    source: r.source as 'steward' | 'manual',
    prNumber: r.prNumber ?? null,
    userCredit: r.userCredit ?? null,
    status: (r.status ?? 'pending') as 'pending' | 'shipped',
    createdAt: r.createdAt.toISOString(),
  }
}

export async function insertChangelogEntry(input: InsertChangelogEntryInput): Promise<void> {
  const db = getDb()
  await db.insert(changelogEntries).values({
    id: input.id,
    version: input.version,
    label: input.label,
    detail: input.detail,
    source: input.source,
    prNumber: input.prNumber,
    userCredit: input.userCredit,
    status: input.status,
    createdAt: new Date(),
  })
}

export async function listChangelogEntries(): Promise<ChangelogEntry[]> {
  const db = getDb()
  const rows = await db.select().from(changelogEntries).orderBy(desc(changelogEntries.createdAt))
  return rows.map(rowToEntry)
}

export async function getChangelogEntryByPrNumber(prNumber: number): Promise<ChangelogEntry | null> {
  const db = getDb()
  const rows = await db
    .select()
    .from(changelogEntries)
    .where(eq(changelogEntries.prNumber, prNumber))
    .orderBy(desc(changelogEntries.createdAt))
    .limit(1)

  return rows[0] ? rowToEntry(rows[0]) : null
}

export async function shipChangelogEntryByPrNumber(prNumber: number): Promise<void> {
  const db = getDb()
  await db
    .update(changelogEntries)
    .set({ status: 'shipped' })
    .where(eq(changelogEntries.prNumber, prNumber))
}

export async function deleteChangelogEntryByPrNumber(prNumber: number): Promise<void> {
  const db = getDb()
  await db.delete(changelogEntries).where(eq(changelogEntries.prNumber, prNumber))
}
