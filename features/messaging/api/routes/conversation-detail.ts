import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { assertConversationParticipant, MessagingError } from '@/features/messaging/server/service'
import { listConversationsForUser, listMessagesAfter } from '@/features/messaging/server/repository'
import { ok, err } from '../responseHelpers'

export async function GET(request: Request, conversationId: string) {
  const auth = getRequestAuthCtx()
  try {
    await assertConversationParticipant(conversationId, auth.userId)
  } catch (e) {
    if (e instanceof MessagingError) return err(e.status, e.message)
    throw e
  }

  const convos = await listConversationsForUser(auth.userId)
  const conv = convos.find((c) => c.id === conversationId)
  if (!conv) return err(404, 'Conversation not found')

  const msgs = await listMessagesAfter(conversationId, null, 50)
  return ok({ conversation: conv, messages: msgs })
}
