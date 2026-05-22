/**
 * Read-only DB inspection — row counts and demo-data indicators.
 * Run: npx dotenv -e .env.local -- npx tsx scripts/check-db-seed.ts
 */
import postgres from 'postgres'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const sql = postgres(url, { ssl: 'require', max: 1 })

  try {
    const tables = [
      'users',
      'households',
      'learners',
      'subjects',
      'lesson_tasks',
      'attendance_events',
      'quran_sessions',
      'portfolio_evidence',
    ] as const

    console.log('=== ROW COUNTS ===')
    for (const t of tables) {
      const [{ n }] = await sql.unsafe<{ n: number }[]>(
        `SELECT COUNT(*)::int AS n FROM ${t}`,
      )
      console.log(`${t}: ${n}`)
    }

    const users = await sql`
      SELECT id, email, name, created_at
      FROM users
      ORDER BY created_at
    `
    console.log('\n=== USERS ===')
    console.log(JSON.stringify(users, null, 2))

    const households = await sql`
      SELECT h.id, h.name, u.email AS user_email
      FROM households h
      JOIN users u ON u.id = h.user_id
      ORDER BY h.created_at
    `
    console.log('\n=== HOUSEHOLDS ===')
    console.log(JSON.stringify(households, null, 2))

    const learners = await sql`
      SELECT l.name, l.grade_level, h.name AS household, u.email AS user_email
      FROM learners l
      JOIN households h ON h.id = l.household_id
      JOIN users u ON u.id = h.user_id
      ORDER BY l.created_at
    `
    console.log('\n=== LEARNERS ===')
    console.log(JSON.stringify(learners, null, 2))

    const demoNames = await sql`
      SELECT name FROM learners
      WHERE name IN ('Layth', 'Hawa', 'Adam', 'Khadijah', 'Zayd')
    `
    console.log('\n=== DEMO-LIKE LEARNER NAMES ===')
    console.log(JSON.stringify(demoNames, null, 2))

    const tablesList = await sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    console.log('\n=== PUBLIC TABLES ===')
    console.log(tablesList.map((r) => r.tablename).join(', '))

    const migrationRows = await sql`
      SELECT id, hash, created_at
      FROM drizzle.__drizzle_migrations
      ORDER BY created_at
    `.catch(() => null)
    console.log('\n=== MIGRATIONS APPLIED ===')
    console.log(
      migrationRows
        ? JSON.stringify(migrationRows, null, 2)
        : '(drizzle.__drizzle_migrations not found)',
    )

    const learnerCount =
      (await sql`SELECT COUNT(*)::int AS n FROM learners`)[0].n
    const userCount = (await sql`SELECT COUNT(*)::int AS n FROM users`)[0].n
    console.log('\n=== VERDICT ===')
    if (learnerCount > 0) {
      console.log('SEEDED: demo learners exist in Postgres.')
    } else if (userCount > 0) {
      console.log(
        'NOT SEEDED: users/households exist (sign-in provisioned) but no learners.',
      )
    } else {
      console.log(
        'NOT SEEDED: database is empty — no users, no demo data. Run db:migrate then db:seed:dev if you want demo rows.',
      )
    }
  } finally {
    await sql.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
