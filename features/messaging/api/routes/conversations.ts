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
  return ok({ conversations })
}

export async function POST(request: Request) {
  const auth = getRequestAuthCtx()
  const body = await request.json().catch(() => ({}))

  if (body?.type === 'direct') {
    const target = body.target as { email?: string; userId?: string } | undefined
    if (!target || (!target.email && !target.userId)) {
      return err(400, 'Direct conversations require a target user (email or userId)')
    }
    try {
      const conv = await openDirectConversation(
        auth.userId,
        target.email ? { email: target.email } : { userId: target.userId as string },
      )
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
