/**
 * Read-only check: has migration 0017 (messaging tables) been applied?
 * Run: npx dotenv -e .env.local -- npx tsx scripts/check-migration-0017.ts
 */
import { sql } from 'drizzle-orm'
import { getDb, closeDb } from '@/features/lib/server/db'
import { conversations, messages, conversationParticipants, messageAttachments } from '@/db/schema'

async function main() {
  const db = getDb()

  console.log('=== drizzle migrations journal (last 5) ===')
  try {
    const rows = await db.execute(
      sql`select * from drizzle.__drizzle_migrations order by created_at desc limit 5`,
    )
    for (const row of rows) console.log(row)
  } catch (e) {
    console.log('journal query failed:', (e as Error).message)
  }

  console.log('\n=== messaging table row counts ===')
  for (const [name, table] of [
    ['conversations', conversations],
    ['conversation_participants', conversationParticipants],
    ['messages', messages],
    ['message_attachments', messageAttachments],
  ] as const) {
    try {
      const rows = await db.select().from(table as never).limit(1)
      console.log(`${name}: table exists (sample rows returned: ${rows.length})`)
    } catch (e) {
      console.log(`${name}: query failed — ${(e as Error).message}`)
    }
  }

  await closeDb()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
