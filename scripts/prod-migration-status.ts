/**
 * READ-ONLY production migration status vs repo journal (Drizzle ORM).
 *
 *   npm run db:status:prod
 *
 * Uses DATABASE_URL_PROD from .env.local.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { count, sql } from 'drizzle-orm'
import { getDb, closeDb } from '@/features/lib/server/db'
import { applyProdDatabaseUrl, safeDbTarget } from './lib/prod-env'
import { KEY_SCHEMA_TABLES, SCHEMA_TABLES } from './lib/schema-tables'

type MigrationRow = { id: number; hash: string; created_at: string }
type JournalEntry = { idx: number; tag: string; when: number }
type Journal = { entries: JournalEntry[] }

async function main() {
  const prodUrl = applyProdDatabaseUrl()
  console.log(`db:status:prod — PRODUCTION (${safeDbTarget(prodUrl)})\n`)

  const journalPath = join(process.cwd(), 'db', 'migrations', 'meta', '_journal.json')
  const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as Journal
  const expected = journal.entries

  const db = getDb()

  console.log('=== Applied migrations (drizzle.__drizzle_migrations) ===')
  let applied: MigrationRow[] = []
  try {
    applied = (await db.execute(
      sql`SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`,
    )) as unknown as MigrationRow[]
    for (const r of applied) {
      const ts = Number(r.created_at)
      const when = Number.isFinite(ts) ? new Date(ts).toISOString() : String(r.created_at)
      console.log(`  #${r.id}  ${when}  ${r.hash.slice(0, 16)}…`)
    }
  } catch (err) {
    console.log(`  ERROR: ${(err as Error).message}`)
  }

  const appliedCount = applied.length
  const expectedCount = expected.length
  const pending = expected.slice(appliedCount)

  console.log(`\n=== Summary ===`)
  console.log(
    `  Repo journal:   ${expectedCount} migrations (${expected[0]?.tag} … ${expected[expected.length - 1]?.tag})`,
  )
  console.log(`  Prod applied:   ${appliedCount}`)
  console.log(`  Pending on prod: ${pending.length}`)

  if (pending.length > 0) {
    console.log('\n=== Pending (not yet applied on prod) ===')
    for (const entry of pending) {
      console.log(`  ${String(entry.idx).padStart(2, '0')}  ${entry.tag}`)
    }
  } else if (appliedCount >= expectedCount) {
    console.log('\n  Prod is up to date with the repo journal.')
  }

  console.log('\n=== Key table probes (Drizzle select count) ===')
  for (const { name, table } of KEY_SCHEMA_TABLES) {
    try {
      const [row] = await db.select({ count: count() }).from(table)
      console.log(`  ${name.padEnd(28)} exists (${row?.count ?? '?'} rows)`)
    } catch (err) {
      console.log(`  ${name.padEnd(28)} MISSING or error — ${(err as Error).message}`)
    }
  }

  console.log(`\n=== Schema tables in repo (${SCHEMA_TABLES.length}) ===`)
  let reachable = 0
  for (const { name, table } of SCHEMA_TABLES) {
    try {
      await db.select({ count: count() }).from(table)
      reachable += 1
    } catch {
      // table missing on prod — counted below
    }
  }
  console.log(`  ${reachable} of ${SCHEMA_TABLES.length} schema tables reachable on prod`)

  await closeDb()
  process.exit(pending.length > 0 ? 2 : 0)
}

main().catch(async err => {
  console.error(err)
  await closeDb()
  process.exit(1)
})
