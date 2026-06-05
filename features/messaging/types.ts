export type ConversationType = 'direct' | 'group'
export type ParticipantRole = 'admin' | 'member'

export interface Conversation {
  id: string
  type: ConversationType
  title: string | null
  createdByUserId: string
  lastMessageAt: string | null
  settings: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface ConversationParticipant {
  id: string
  conversationId: string
  userId: string
  role: ParticipantRole
  lastReadAt: string | null
  joinedAt: string
  leftAt: string | null
  // denormalized from users join
  userName: string | null
  userEmail: string
}

export interface Message {
  id: string
  conversationId: string
  senderUserId: string
  senderName: string | null
  body: string
  createdAt: string
  attachmentIds: string[]
}

export interface MessageAttachmentMeta {
  id: string
  messageId: string
  kind: 'image'
  mimeType: string
  sizeBytes: number
  createdAt: string
}

export interface ConversationSummary extends Conversation {
  unreadCount: number
  lastMessage: { body: string; senderUserId: string } | null
  participants: Pick<ConversationParticipant, 'userId' | 'userName' | 'userEmail' | 'role'>[]
}
