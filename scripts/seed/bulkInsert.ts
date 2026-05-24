/**
 * Bulk INSERT helper for seed scripts.
 *
 * Hard rule: seed scripts must never issue one INSERT per row.
 * Always batch rows into chunked multi-value INSERT statements.
 */

import type { PgTable } from 'drizzle-orm/pg-core'

/** Rows per INSERT statement. Tune if Postgres rejects very large statements. */
export const BULK_CHUNK_SIZE = 1000

type InsertExecutor = {
  insert: (table: PgTable) => {
    values: (rows: Record<string, unknown>[]) => {
      onConflictDoNothing: () => Promise<unknown>
    }
  }
}

export async function bulkInsertRows<T extends Record<string, unknown>>(
  db: InsertExecutor,
  table: PgTable,
  rows: T[],
  label: string,
): Promise<number> {
  if (rows.length === 0) return 0

  let inserted = 0
  for (let i = 0; i < rows.length; i += BULK_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + BULK_CHUNK_SIZE)
    await db.insert(table).values(chunk).onConflictDoNothing()
    inserted += chunk.length
  }

  console.log(`    ${label}: ${inserted.toLocaleString()} rows (${Math.ceil(rows.length / BULK_CHUNK_SIZE)} bulk insert(s))`)
  return inserted
}

export function countByTable(rows: Record<string, unknown[]>): Record<string, number> {
  return Object.fromEntries(Object.entries(rows).map(([key, value]) => [key, value.length]))
}
