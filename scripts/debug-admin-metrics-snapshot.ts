/**
 * One-off diagnostic: households + usage_events breakdown.
 * Run: npx dotenv -e .env.local -- tsx scripts/debug-admin-metrics-snapshot.ts
 */
import { getDb } from '../features/lib/server/db'
import { households, users, usageEvents } from '../db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  const db = getDb()
  const hh = await db
    .select({
      householdId: households.id,
      name: households.name,
      email: users.email,
    })
    .from(households)
    .innerJoin(users, eq(households.userId, users.id))

  console.log('\n=== households (admin table rows) ===')
  console.log(JSON.stringify(hh, null, 2))

  const events = await db.select().from(usageEvents)
  console.log(`\n=== usage_events total: ${events.length} ===`)

  const byArea: Record<string, number> = {}
  const byType: Record<string, number> = {}
  for (const e of events) {
    byArea[e.featureArea] = (byArea[e.featureArea] ?? 0) + 1
    byType[e.eventType] = (byType[e.eventType] ?? 0) + 1
  }
  console.log('\nBy featureArea (what "By area" tags count):')
  console.log(byArea)
  console.log('\nBy eventType (what Reports/Sessions columns use):')
  console.log(byType)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
