import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { assertConversationParticipant, MessagingError } from '@/features/messaging/server/service'
import { listMessagesAfter, insertMessage } from '@/features/messaging/server/repository'
import { ok, err } from '../responseHelpers'

export async function GET(request: Request, conversationId: string) {
  const auth = getRequestAuthCtx()
  try {
    await assertConversationParticipant(conversationId, auth.userId)
  } catch (e) {
    if (e instanceof MessagingError) return err(e.status, e.message)
    throw e
  }

  const url = new URL(request.url)
  const after = url.searchParams.get('after') ?? null
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100)

  const msgs = await listMessagesAfter(conversationId, after, limit)
  return ok(msgs)
}

export async function POST(request: Request, conversationId: string) {
  const auth = getRequestAuthCtx()
  try {
    await assertConversationParticipant(conversationId, auth.userId)
  } catch (e) {
    if (e instanceof MessagingError) return err(e.status, e.message)
    throw e
  }

  const body = await request.json().catch(() => ({}))
  const { body: messageBody } = body as { body?: string }
  if (!messageBody || typeof messageBody !== 'string') {
    return err(400, 'Message body is required')
  }

  const msg = await insertMessage({
    conversationId,
    senderUserId: auth.userId,
    body: messageBody,
  })
  return ok(msg)
}
