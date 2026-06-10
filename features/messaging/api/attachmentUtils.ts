import { eq } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { messages } from '@/db/schema'

/** Resolves the conversationId that owns a given messageId — used for attachment IDOR guard. */
export async function resolveAttachmentConversation(messageId: string): Promise<string | null> {
  const db = getDb()
  const rows = await db
    .select({ conversationId: messages.conversationId })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1)
  return rows[0]?.conversationId ?? null
}
