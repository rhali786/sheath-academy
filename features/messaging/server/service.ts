import {
  getActiveParticipant,
  createDirectConversation,
  getUserByEmail,
  getUnreadTotal,
} from './repository'
import type { conversations } from '@/db/schema'

export class MessagingError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'MessagingError'
    this.status = status
  }
}

/** Throws 403 unless the user has an active (leftAt IS NULL) participant row. */
export async function assertConversationParticipant(
  conversationId: string,
  userId: string,
): Promise<void> {
  const participant = await getActiveParticipant(conversationId, userId)
  if (!participant) {
    throw new MessagingError(403, 'Not a participant of this conversation')
  }
}

/** Throws 403 unless the user is an active participant with role = 'admin'. */
export async function assertConversationAdmin(
  conversationId: string,
  userId: string,
): Promise<void> {
  const participant = await getActiveParticipant(conversationId, userId)
  if (!participant || participant.role !== 'admin') {
    throw new MessagingError(403, 'Admin role required for this action')
  }
}

/**
 * Opens or returns an existing direct conversation between the current user and
 * a target identified by userId or email.  Deduplication is handled by the
 * repository — calling twice for the same pair returns the same conversation.
 * Throws MessagingError(404) if an email is given but no account is found,
 * or MessagingError(400) if the target resolves to the current user.
 */
export async function openDirectConversation(
  currentUserId: string,
  target: { userId: string } | { email: string },
): Promise<(typeof conversations)['$inferSelect']> {
  let targetUserId: string

  if ('email' in target) {
    const user = await getUserByEmail(target.email)
    if (!user) {
      throw new MessagingError(404, 'No account found for that email')
    }
    targetUserId = user.id
  } else {
    targetUserId = target.userId
  }

  if (targetUserId === currentUserId) {
    throw new MessagingError(400, 'You cannot start a conversation with yourself')
  }

  return createDirectConversation(currentUserId, targetUserId)
}

/** Returns the total unread message count across all active conversations for a user. */
export async function getUnreadCount(userId: string): Promise<number> {
  return getUnreadTotal(userId)
}
