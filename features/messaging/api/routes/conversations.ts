import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { openDirectConversation, MessagingError } from '@/features/messaging/server/service'
import {
  listConversationsForUser,
  createGroupConversation,
} from '@/features/messaging/server/repository'
import { ok, err } from '../responseHelpers'

export async function GET() {
  const auth = getRequestAuthCtx()
  const conversations = await listConversationsForUser(auth.userId)
  return ok(conversations)
}

export async function POST(request: Request) {
  const auth = getRequestAuthCtx()
  const body = await request.json().catch(() => ({}))

  if ('email' in body || 'userId' in body) {
    const target =
      'email' in body
        ? { email: body.email as string }
        : { userId: body.userId as string }
    try {
      const conv = await openDirectConversation(auth.userId, target)
      return ok(conv)
    } catch (e) {
      if (e instanceof MessagingError) return err(e.status, e.message)
      throw e
    }
  }

  const { title, participantUserIds } = body as {
    title?: string
    participantUserIds?: string[]
  }
  if (!title || !Array.isArray(participantUserIds) || participantUserIds.length === 0) {
    return err(400, 'Group conversations require a title and at least one participant')
  }
  const conv = await createGroupConversation(auth.userId, title, participantUserIds)
  return ok(conv)
}
