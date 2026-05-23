/**
 * Demo household seed — bulk load only.
 *
 * Run with: npm run db:seed:demo
 *
 * Prerequisite: wipe first (`npm run db:wipe` or db/wipe_app_data.sql).
 * Demo seed assumes an empty database; it does not update existing rows.
 *
 * Strategy: build all rows in memory, then load via chunked multi-row INSERTs
 * in a single transaction. See docs/database-seeding.md.
 */

import { getDevSeedUserEmail } from '../features/lib/server/devUserEmail'
import { getDemoHouseholdConfigs } from './seed/demoConfig'
import { buildDemoSeedPayload, summarizePayload } from './seed/buildPayload'
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
