/**
 * Demo household seed — bulk load only.
 *
 * Run with: npm run db:seed:demo
 *
 * Prerequisite: an EMPTY database. The seed uses ON CONFLICT DO NOTHING and does
 * not update existing rows, so re-seeding a populated DB is a no-op. The wipe/reset
 * scripts were removed (2026-06-08, after db:reset:demo truncated prod) — for a clean
 * re-seed, point DATABASE_URL at a fresh/empty database, and never at prod.
 *
 * Strategy: build all rows in memory, then load via chunked multi-row INSERTs
 * in a single transaction. See docs/database-seeding.md.
 */

import { getDevSeedUserEmail } from '../features/lib/server/devUserEmail'
import { getDemoHouseholdConfigs } from './seed/demoConfig'
import { buildDemoSeedPayload, summarizePayload, seedHistoryEndDate } from './seed/buildPayload'
import { loadDemoSeedPayload } from './seed/loadPayload'

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Add it to .env.local (see .env.example).')
    process.exit(1)
  }

  const devEmail = getDevSeedUserEmail()
  const aminaEmail = process.env.DEMO_PARENT_B_EMAIL ?? 'amina@gmail.com'
  const configs = getDemoHouseholdConfigs(devEmail, aminaEmail)

  console.log('db:seed:demo — bulk seed (two households, 150-day history)')
  console.log(`  Household A: ${devEmail} (Barakah Academy)`)
  console.log(`  Household B: ${aminaEmail} (Crescent Cove Learning)`)
  console.log('  Building payload in memory…')

  const endDate = seedHistoryEndDate()
  console.log(`  History end date (includes today): ${endDate}`)

  const payload = buildDemoSeedPayload(configs)
  const counts = summarizePayload(payload)
  const totalRows = Object.values(counts).reduce((sum, n) => sum + n, 0)

  for (const [table, count] of Object.entries(counts)) {
    console.log(`    ${table}: ${count.toLocaleString()}`)
  }
  console.log(`  Total rows: ${totalRows.toLocaleString()}`)

  await loadDemoSeedPayload(payload)

  console.log('\ndb:seed:demo — done')
  console.log('Sign in as dev bypass or amina@gmail.com (magic link) to see the data.')
  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
