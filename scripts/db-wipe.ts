/**
 * Wipes all application data from Postgres (keeps schema/migrations).
 *
 *   npm run db:wipe
 *
 * Always run before `npm run db:seed:demo`. See docs/database-seeding.md.
 *
 * Requires DATABASE_URL in .env.local. Does not drop tables.
 */

import { sql } from 'drizzle-orm'
import { getDb } from '../features/lib/server/db'

/** Child tables first; TRUNCATE ... CASCADE also handles FK order. */
const APP_TABLES = [
  'product_validation_responses',
  'portfolio_evidence',
  'quran_sessions',
  'attendance_events',
  'lesson_tasks',
  'resources',
  'subjects',
  'school_years',
  'learners',
  'household_settings',
  'user_settings',
  'households',
  'users',
] as const

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Add it to .env.local (see .env.example).')
    process.exit(1)
  }

  const db = getDb()
  const tableList = APP_TABLES.map(t => `"${t}"`).join(', ')

  console.log('db:wipe — truncating all application tables…')
  await db.execute(sql.raw(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`))

  console.log('db:wipe — done. Row counts (should all be 0):')
  for (const table of APP_TABLES) {
    const result = await db.execute<{ count: string }>(
      sql.raw(`SELECT COUNT(*)::text AS count FROM "${table}"`),
    )
    const count = (result as { count: string }[])[0]?.count ?? '?'
    console.log(`  ${table}: ${count}`)
  }
  console.log('\nDatabase is empty. Run npm run db:seed:demo when demo seed is available.')
  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
