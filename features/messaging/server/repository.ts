import { eq, and, or, gt, isNull, isNotNull, sql, desc, asc, inArray } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { getDb } from '@/features/lib/server/db'
import {
  conversations,
  conversationParticipants,
  messages,
  messageAttachments,
  users,
} from '@/db/schema'
import type { ConversationSummary } from '../types'

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
const MAX_ATTACHMENT_BYTES = 1_048_576 // 1 MB

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function toIsoOrNull(value: Date | string | null | undefined): string | null {
  if (value == null) return null
  return toIso(value)
}

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// ── Conversations ─────────────────────────────────────────────────────────────

/** Find an existing direct conversation between exactly two users, or null. */
async function findDirectConversation(
  userIdA: string,
  userIdB: string,
): Promise<(typeof conversations.$inferSelect) | null> {
  const db = getDb()
  // A direct conversation where both users are active participants (leftAt IS NULL)
  const result = await db
    .select({ id: conversations.id })
    .from(conversations)
    .innerJoin(
      conversationParticipants,
      eq(conversationParticipants.conversationId, conversations.id),
    )
    .where(
      and(
        eq(conversations.type, 'direct'),
        or(
          eq(conversationParticipants.userId, userIdA),
          eq(conversationParticipants.userId, userIdB),
        ),
        isNull(conversationParticipants.leftAt),
      ),
    )
    .groupBy(conversations.id)
    .having(sql`count(distinct ${conversationParticipants.userId}) = 2`)

  if (result.length === 0) return null
  // Verify both users are actually in the same conversation
  for (const row of result) {
    const participants = await db
      .select({ userId: conversationParticipants.userId })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, row.id),
          isNull(conversationParticipants.leftAt),
        ),
      )
    const userIds = participants.map((p) => p.userId)
    if (userIds.includes(userIdA) && userIds.includes(userIdB) && userIds.length === 2) {
      const full = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, row.id))
        .limit(1)
      return full[0] ?? null
    }
  }
  return null
}

/**
 * Returns an existing direct conversation between two users, or creates one.
 * Idempotent — calling twice for the same pair returns the same row.
 */
export async function createDirectConversation(
  userIdA: string,
  userIdB: string,
): Promise<typeof conversations.$inferSelect> {
  const existing = await findDirectConversation(userIdA, userIdB)
  if (existing) return existing

  const db = getDb()
  const now = new Date()
  const convId = newId('conv')

  const [conv] = await db
    .insert(conversations)
    .values({
      id: convId,
      type: 'direct',
      title: null,
      createdByUserId: userIdA,
      lastMessageAt: null,
      settings: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  await db.insert(conversationParticipants).values([
    {
      id: newId('cp'),
      conversationId: convId,
      userId: userIdA,
      role: 'member',
      lastReadAt: null,
      joinedAt: now,
      leftAt: null,
    },
    {
      id: newId('cp'),
      conversationId: convId,
      userId: userIdB,
      role: 'member',
      lastReadAt: null,
      joinedAt: now,
      leftAt: null,
    },
  ])

  return conv
}

/** Creates a group conversation; creator becomes admin. */
export async function createGroupConversation(
  creatorUserId: string,
  title: string,
  participantUserIds: string[],
): Promise<typeof conversations.$inferSelect> {
  const db = getDb()
  const now = new Date()
  const convId = newId('conv')

  const [conv] = await db
    .insert(conversations)
    .values({
      id: convId,
      type: 'group',
      title,
      createdByUserId: creatorUserId,
      lastMessageAt: null,
      settings: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  const allUsers = [creatorUserId, ...participantUserIds.filter((id) => id !== creatorUserId)]
  await db.insert(conversationParticipants).values(
    allUsers.map((userId) => ({
      id: newId('cp'),
      conversationId: convId,
      userId,
      role: userId === creatorUserId ? 'admin' : 'member',
      lastReadAt: null,
      joinedAt: now,
      leftAt: null,
    })),
  )

  return conv
}

// ── Messages ──────────────────────────────────────────────────────────────────

/** Insert a message and bump conversation.lastMessageAt. */
export async function insertMessage(params: {
  conversationId: string
  senderUserId: string
  body: string
}): Promise<typeof messages.$inferSelect> {
  const db = getDb()
  const now = new Date()

  const [msg] = await db
    .insert(messages)
    .values({
      id: newId('msg'),
      conversationId: params.conversationId,
      senderUserId: params.senderUserId,
      body: params.body,
      reactions: null,
      createdAt: now,
    })
    .returning()

  await db
    .update(conversations)
    .set({ lastMessageAt: now, updatedAt: now })
    .where(eq(conversations.id, params.conversationId))

  return msg
}

/**
 * Returns messages in a conversation after the given message ID (exclusive),
 * sorted ascending by createdAt. If afterMessageId is null, returns all messages.
 */
export async function listMessagesAfter(
  conversationId: string,
  afterMessageId: string | null,
  limit: number,
): Promise<(typeof messages.$inferSelect)[]> {
  const db = getDb()

  if (afterMessageId === null) {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt), asc(messages.id))
      .limit(limit)
  }

  // Find the cursor message's createdAt
  const cursor = await db
    .select({ createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.id, afterMessageId))
    .limit(1)

  if (cursor.length === 0) return []
  const cursorDate = cursor[0].createdAt

  return db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        or(
          gt(messages.createdAt, cursorDate),
          and(eq(messages.createdAt, cursorDate), gt(messages.id, afterMessageId)),
        ),
      ),
    )
    .orderBy(asc(messages.createdAt), asc(messages.id))
    .limit(limit)
}

// ── Inbox ─────────────────────────────────────────────────────────────────────

/** Returns all active conversations for a user, sorted by lastMessageAt desc. */
export async function listConversationsForUser(userId: string): Promise<ConversationSummary[]> {
  const db = getDb()

  const convRows = await db
    .select({
      id: conversations.id,
      type: conversations.type,
      title: conversations.title,
      createdByUserId: conversations.createdByUserId,
      lastMessageAt: conversations.lastMessageAt,
      settings: conversations.settings,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversationParticipants)
    .innerJoin(conversations, eq(conversationParticipants.conversationId, conversations.id))
    .where(
      and(eq(conversationParticipants.userId, userId), isNull(conversationParticipants.leftAt)),
    )
    .orderBy(desc(conversations.lastMessageAt))

  if (convRows.length === 0) return []

  const convIds = convRows.map((c) => c.id)

  const [allParticipants, unreadRows, lastMsgResult] = await Promise.all([
    db
      .select({
        conversationId: conversationParticipants.conversationId,
        userId: conversationParticipants.userId,
        role: conversationParticipants.role,
        userName: users.name,
        userEmail: users.email,
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(users.id, conversationParticipants.userId))
      .where(
        and(
          inArray(conversationParticipants.conversationId, convIds),
          isNull(conversationParticipants.leftAt),
        ),
      ),
    db
      .select({
        conversationId: messages.conversationId,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(messages)
      .innerJoin(
        conversationParticipants,
        and(
          eq(conversationParticipants.conversationId, messages.conversationId),
          eq(conversationParticipants.userId, userId),
          isNull(conversationParticipants.leftAt),
        ),
      )
      .where(
        and(
          inArray(messages.conversationId, convIds),
          sql`${messages.senderUserId} <> ${userId}`,
          or(
            isNull(conversationParticipants.lastReadAt),
            gt(messages.createdAt, conversationParticipants.lastReadAt),
          ),
        ),
      )
      .groupBy(messages.conversationId),
    db.execute<{ conversationId: string; body: string; senderUserId: string }>(sql`
      SELECT DISTINCT ON (m.conversation_id)
        m.conversation_id AS "conversationId",
        m.body AS body,
        m.sender_user_id AS "senderUserId"
      FROM messages m
      WHERE m.conversation_id IN (${sql.join(convIds.map((id) => sql`${id}`), sql`, `)})
      ORDER BY m.conversation_id, m.created_at DESC
    `),
  ])

  const lastMsgRows = lastMsgResult as unknown as {
    conversationId: string
    body: string
    senderUserId: string
  }[]

  const unreadMap = new Map(unreadRows.map((u) => [u.conversationId, u.count]))
  const lastMsgMap = new Map(lastMsgRows.map((l) => [l.conversationId, l]))

  return convRows.map((conv) => ({
    ...conv,
    type: conv.type as 'direct' | 'group',
    lastMessageAt: conv.lastMessageAt?.toISOString() ?? null,
    createdAt: conv.createdAt.toISOString(),
    updatedAt: conv.updatedAt.toISOString(),
    settings: (conv.settings as Record<string, unknown>) ?? null,
    unreadCount: unreadMap.get(conv.id) ?? 0,
    lastMessage: (() => {
      const lm = lastMsgMap.get(conv.id)
      return lm ? { body: lm.body, senderUserId: lm.senderUserId } : null
    })(),
    participants: allParticipants
      .filter((p) => p.conversationId === conv.id)
      .map((p) => ({
        userId: p.userId,
        role: p.role as 'admin' | 'member',
        userName: p.userName,
        userEmail: p.userEmail,
      })),
  }))
}

/**
 * Thread-detail loader: one JOIN query for conversation + participants.
 * Skips inbox-only fields (unreadCount, lastMessage) — the detail route loads messages separately.
 */
export async function getConversationForUser(
  userId: string,
  conversationId: string,
): Promise<ConversationSummary | null> {
  const db = getDb()
  const myParticipation = alias(conversationParticipants, 'my_participation')

  const rows = await db
    .select({
      id: conversations.id,
      type: conversations.type,
      title: conversations.title,
      createdByUserId: conversations.createdByUserId,
      lastMessageAt: conversations.lastMessageAt,
      settings: conversations.settings,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      participantUserId: conversationParticipants.userId,
      role: conversationParticipants.role,
      userName: users.name,
      userEmail: users.email,
    })
    .from(conversations)
    .innerJoin(
      myParticipation,
      and(
        eq(myParticipation.conversationId, conversations.id),
        eq(myParticipation.userId, userId),
        isNull(myParticipation.leftAt),
      ),
    )
    .innerJoin(
      conversationParticipants,
      and(
        eq(conversationParticipants.conversationId, conversations.id),
        isNull(conversationParticipants.leftAt),
      ),
    )
    .innerJoin(users, eq(users.id, conversationParticipants.userId))
    .where(eq(conversations.id, conversationId))

  if (rows.length === 0) return null

  const head = rows[0]
  return {
    id: head.id,
    type: head.type as 'direct' | 'group',
    title: head.title,
    createdByUserId: head.createdByUserId,
    lastMessageAt: head.lastMessageAt?.toISOString() ?? null,
    settings: (head.settings as Record<string, unknown>) ?? null,
    createdAt: head.createdAt.toISOString(),
    updatedAt: head.updatedAt.toISOString(),
    unreadCount: 0,
    lastMessage: null,
    participants: rows.map((p) => ({
      userId: p.participantUserId,
      role: p.role as 'admin' | 'member',
      userName: p.userName,
      userEmail: p.userEmail,
    })),
  }
}

/** Thread open: conversation + participants + messages in a single DB round-trip. */
export async function loadConversationDetailForUser(
  userId: string,
  conversationId: string,
): Promise<{
  conversation: ConversationSummary
  messages: (typeof messages.$inferSelect)[]
  participants: ConversationSummary['participants']
} | null> {
  const db = getDb()

  type DetailRow = {
    convId: string
    convType: string
    title: string | null
    createdByUserId: string
    lastMessageAt: Date | null
    settings: unknown
    createdAt: Date
    updatedAt: Date
    participants: ConversationSummary['participants'] | string
    messages:
      | Array<{
          id: string
          conversationId: string
          senderUserId: string
          body: string
          reactions: unknown
          createdAt: Date | string
        }>
      | string
  }

  const result = await db.execute(sql`
    SELECT
      c.id AS "convId",
      c.type AS "convType",
      c.title AS title,
      c.created_by_user_id AS "createdByUserId",
      c.last_message_at AS "lastMessageAt",
      c.settings AS settings,
      c.created_at AS "createdAt",
      c.updated_at AS "updatedAt",
      (
        SELECT COALESCE(json_agg(json_build_object(
          'userId', cp.user_id,
          'role', cp.role,
          'userName', u.name,
          'userEmail', u.email
        ) ORDER BY cp.user_id), '[]'::json)
        FROM conversation_participants cp
        INNER JOIN users u ON u.id = cp.user_id
        WHERE cp.conversation_id = c.id AND cp.left_at IS NULL
      ) AS participants,
      (
        SELECT COALESCE(json_agg(json_build_object(
          'id', m.id,
          'conversationId', m.conversation_id,
          'senderUserId', m.sender_user_id,
          'body', m.body,
          'reactions', m.reactions,
          'createdAt', m.created_at
        ) ORDER BY m.created_at ASC, m.id ASC), '[]'::json)
        FROM (
          SELECT id, conversation_id, sender_user_id, body, reactions, created_at
          FROM messages
          WHERE conversation_id = c.id
          ORDER BY created_at ASC, id ASC
          LIMIT 50
        ) m
      ) AS messages
    FROM conversations c
    INNER JOIN conversation_participants my_cp
      ON my_cp.conversation_id = c.id
      AND my_cp.user_id = ${userId}
      AND my_cp.left_at IS NULL
    WHERE c.id = ${conversationId}
    LIMIT 1
  `)

  const rows = result as unknown as DetailRow[]

  if (rows.length === 0) return null

  const row = rows[0]
  const participantsRaw = row.participants
  const participants: ConversationSummary['participants'] =
    typeof participantsRaw === 'string'
      ? (JSON.parse(participantsRaw) as ConversationSummary['participants'])
      : (participantsRaw ?? [])
  const messagesRaw = row.messages
  const parsedMessages =
    typeof messagesRaw === 'string'
      ? (JSON.parse(messagesRaw) as DetailRow['messages'])
      : (messagesRaw ?? [])

  const messageRows: (typeof messages.$inferSelect)[] = (Array.isArray(parsedMessages) ? parsedMessages : []).map((m) => ({
    id: m.id,
    conversationId: m.conversationId,
    senderUserId: m.senderUserId,
    body: m.body,
    reactions: m.reactions as (typeof messages.$inferSelect)['reactions'],
    createdAt: m.createdAt instanceof Date ? m.createdAt : new Date(m.createdAt),
  }))

  const conversation: ConversationSummary = {
    id: row.convId,
    type: row.convType as 'direct' | 'group',
    title: row.title,
    createdByUserId: row.createdByUserId,
    lastMessageAt: toIsoOrNull(row.lastMessageAt),
    settings: (row.settings as Record<string, unknown>) ?? null,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    unreadCount: 0,
    lastMessage: null,
    participants,
  }

  return { conversation, messages: messageRows, participants }
}

// ── Unread total ──────────────────────────────────────────────────────────────

/** Sum of unread messages across all active conversations for the user. */
export async function getUnreadTotal(userId: string): Promise<number> {
  const db = getDb()

  const participations = await db
    .select({
      conversationId: conversationParticipants.conversationId,
      lastReadAt: conversationParticipants.lastReadAt,
    })
    .from(conversationParticipants)
    .where(
      and(eq(conversationParticipants.userId, userId), isNull(conversationParticipants.leftAt)),
    )

  if (participations.length === 0) return 0

  const counts = await Promise.all(
    participations.map(async (p) => {
      const result = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, p.conversationId),
            sql`${messages.senderUserId} <> ${userId}`,
            p.lastReadAt ? gt(messages.createdAt, p.lastReadAt) : sql`true`,
          ),
        )
      return result[0]?.count ?? 0
    }),
  )

  return counts.reduce((sum, n) => sum + n, 0)
}

/** Advance lastReadAt to now for the user in a conversation. */
export async function markRead(conversationId: string, userId: string): Promise<void> {
  await getDb()
    .update(conversationParticipants)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
      ),
    )
}

// ── Participant management ────────────────────────────────────────────────────

export async function addParticipant(conversationId: string, userId: string): Promise<void> {
  const db = getDb()
  const now = new Date()
  // Re-activate if they previously left
  const existing = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(conversationParticipants)
      .set({ leftAt: null, joinedAt: now })
      .where(eq(conversationParticipants.id, existing[0].id))
  } else {
    await db.insert(conversationParticipants).values({
      id: newId('cp'),
      conversationId,
      userId,
      role: 'member',
      lastReadAt: null,
      joinedAt: now,
      leftAt: null,
    })
  }
}

/** Admin-initiated removal — sets leftAt. */
export async function removeParticipant(conversationId: string, userId: string): Promise<void> {
  await getDb()
    .update(conversationParticipants)
    .set({ leftAt: new Date() })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
        isNull(conversationParticipants.leftAt),
      ),
    )
}

/** Member self-leave — sets leftAt. */
export async function selfLeave(conversationId: string, userId: string): Promise<void> {
  await removeParticipant(conversationId, userId)
}

// ── Attachments ───────────────────────────────────────────────────────────────

export async function insertAttachment(params: {
  messageId: string
  kind: string
  mimeType: string
  data: Buffer
}): Promise<typeof messageAttachments.$inferSelect> {
  if (params.data.length > MAX_ATTACHMENT_BYTES) {
    throw new Error(`Attachment size ${params.data.length} exceeds limit of ${MAX_ATTACHMENT_BYTES} bytes`)
  }
  if (!ALLOWED_MIME_TYPES.has(params.mimeType)) {
    throw new Error(`MIME type ${params.mimeType} is not an allowed image type`)
  }

  const db = getDb()
  const now = new Date()
  const [row] = await db
    .insert(messageAttachments)
    .values({
      id: newId('att'),
      messageId: params.messageId,
      kind: params.kind,
      mimeType: params.mimeType,
      sizeBytes: params.data.length,
      data: params.data,
      createdAt: now,
    })
    .returning()
  return row
}

export async function getAttachment(
  attachmentId: string,
): Promise<typeof messageAttachments.$inferSelect | null> {
  const db = getDb()
  const rows = await db
    .select()
    .from(messageAttachments)
    .where(eq(messageAttachments.id, attachmentId))
    .limit(1)
  return rows[0] ?? null
}

// ── User lookup ───────────────────────────────────────────────────────────────

export async function getUserByEmail(
  email: string,
): Promise<typeof users.$inferSelect | null> {
  const db = getDb()
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return rows[0] ?? null
}

// ── Authorization helpers (used by service layer) ────────────────────────────

/** Returns the participant row if the user is an active participant, else null. */
export async function getActiveParticipant(
  conversationId: string,
  userId: string,
): Promise<typeof conversationParticipants.$inferSelect | null> {
  const db = getDb()
  const rows = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
        isNull(conversationParticipants.leftAt),
      ),
    )
    .limit(1)
  return rows[0] ?? null
}
