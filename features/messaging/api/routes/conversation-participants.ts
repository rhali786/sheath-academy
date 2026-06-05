import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import {
  assertConversationAdmin,
  assertConversationParticipant,
  MessagingError,
} from '@/features/messaging/server/service'
import { addParticipant, removeParticipant, selfLeave } from '@/features/messaging/server/repository'
import { ok, err } from '../responseHelpers'

export async function POST(request: Request, conversationId: string) {
  const auth = getRequestAuthCtx()
  try {
    await assertConversationAdmin(conversationId, auth.userId)
  } catch (e) {
    if (e instanceof MessagingError) return err(e.status, e.message)
    throw e
  }

  const body = await request.json().catch(() => ({}))
  const { userId } = body as { userId?: string }
  if (!userId || typeof userId !== 'string') {
    return err(400, 'userId is required')
  }

  await addParticipant(conversationId, userId)
  return ok(null, 'Participant added')
}

export async function DELETE(request: Request, conversationId: string, targetUserId: string) {
  const auth = getRequestAuthCtx()

  if (targetUserId === auth.userId) {
    // Self-leave: verify they are an active participant before removing
    try {
      await assertConversationParticipant(conversationId, auth.userId)
    } catch (e) {
      if (e instanceof MessagingError) return err(e.status, e.message)
      throw e
    }
    await selfLeave(conversationId, auth.userId)
    return ok(null, 'Left conversation')
  }

  // Admin removing another participant
  try {
    await assertConversationAdmin(conversationId, auth.userId)
  } catch (e) {
    if (e instanceof MessagingError) return err(e.status, e.message)
    throw e
  }
  await removeParticipant(conversationId, targetUserId)
  return ok(null, 'Participant removed')
}
