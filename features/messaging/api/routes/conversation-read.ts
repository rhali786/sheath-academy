import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { assertConversationParticipant, MessagingError } from '@/features/messaging/server/service'
import { markRead } from '@/features/messaging/server/repository'
import { ok, err } from '../responseHelpers'

export async function POST(request: Request, conversationId: string) {
  const auth = getRequestAuthCtx()
  try {
    await assertConversationParticipant(conversationId, auth.userId)
  } catch (e) {
    if (e instanceof MessagingError) return err(e.status, e.message)
    throw e
  }
  await markRead(conversationId, auth.userId)
  return ok(null)
}
