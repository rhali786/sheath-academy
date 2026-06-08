/**
 * READ-ONLY forensic probe. SELECTs only — performs no writes/DDL.
 *   dotenv -e .env.local -- tsx scripts/db-forensic.ts
 */
import { sql } from 'drizzle-orm'
import { getDb, closeDb } from '../features/lib/server/db'

function safeHost(url: string | undefined): string {
  if (!url) return '(unset)'
  try {
    const u = new URL(url)
    return `${u.protocol}//${u.hostname}:${u.port || '5432'}${u.pathname}`
  } catch {
    return '(unparseable)'
  }
}

const COUNT_TABLES = [
  'users',
  'households',
  'household_members',
  'learners',
  'user_feedback',
  'conversations',
  'conversation_participants',
  'messages',
  'changelog_entries',
] as const

async function main() {
  console.log('DB host:', safeHost(process.env.DATABASE_URL))
  const db = getDb()

  console.log('\n=== Existing public tables ===')
  try {
    const tbls = (await db.execute(
      sql.raw(
        `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`,
      ),
    )) as unknown as { table_name: string }[]
    console.log('  ' + (tbls.map(t => t.table_name).join(', ') || '(none)'))
    console.log(`  (total: ${tbls.length})`)
  } catch (err) {
    console.log('  could not list tables:', (err as Error).message)
  }

  console.log('\n=== Applied migrations (drizzle.__drizzle_migrations) ===')
  try {
    const rows = (await db.execute(
      sql.raw(
        `SELECT id, hash, created_at FROM "drizzle"."__drizzle_migrations" ORDER BY created_at`,
      ),
    )) as unknown as { id: number; hash: string; created_at: string }[]
    for (const r of rows) {
      const ts = Number(r.created_at)
      const when = Number.isFinite(ts) ? new Date(ts).toISOString() : String(r.created_at)
      console.log(`  #${r.id}  ${when}  ${r.hash}`)
    }
    console.log(`  (total applied: ${rows.length})`)
  } catch (err) {
    console.log('  could not read migration ledger:', (err as Error).message)
  }

  console.log('\n=== Row counts ===')
  for (const t of COUNT_TABLES) {
    try {
      const res = (await db.execute(
        sql.raw(`SELECT COUNT(*)::text AS count FROM "${t}"`),
      )) as unknown as { count: string }[]
      console.log(`  ${t.padEnd(28)} ${res[0]?.count ?? '?'}`)
    } catch (err) {
      console.log(`  ${t.padEnd(28)} ERROR: ${(err as Error).message}`)
    }
  }

  console.log('\n=== Newest rows (createdAt) to gauge wipe time ===')
  for (const t of ['users', 'households', 'user_feedback'] as const) {
    try {
      const res = (await db.execute(
        sql.raw(`SELECT MIN(created_at) AS oldest, MAX(created_at) AS newest FROM "${t}"`),
      )) as unknown as { oldest: string; newest: string }[]
      console.log(`  ${t.padEnd(16)} oldest=${res[0]?.oldest ?? '-'}  newest=${res[0]?.newest ?? '-'}`)
    } catch (err) {
      console.log(`  ${t.padEnd(16)} ERROR: ${(err as Error).message}`)
    }
  }

  await closeDb()
  process.exit(0)
}

main().catch(async err => {
  console.error(err)
  await closeDb()
  process.exit(1)
})
