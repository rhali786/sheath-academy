import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { loadConversationDetailForUser } from '@/features/messaging/server/repository'
import { ok, err } from '../responseHelpers'

export async function GET(request: Request, conversationId: string) {
  const auth = getRequestAuthCtx()
  const detail = await loadConversationDetailForUser(auth.userId, conversationId)
  if (!detail) return err(404, 'Conversation not found')

  return ok({
    conversation: detail.conversation,
    messages: detail.messages,
    participants: detail.participants,
  })
}
