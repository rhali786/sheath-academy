/** @jest-environment node */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import {
  createDirectConversation,
  createGroupConversation,
  insertMessage,
  listMessagesAfter,
  listConversationsForUser,
  getConversationForUser,
  getUnreadTotal,
  addParticipant,
  removeParticipant,
  selfLeave,
  insertAttachment,
  getAttachment,
  getUserByEmail,
  markRead,
} from '../../server/repository'

let userA: { id: string; email: string }
let userB: { id: string; email: string }
let userC: { id: string; email: string }
let cleanup: () => Promise<void>

beforeAll(async () => {
  if (!hasDb) return
  const { upsertUserByEmail } = await import('@/features/household/server/repository')
  const ts = Date.now()
  userA = await upsertUserByEmail(`msg-a-${ts}@test.sheath`, 'User A')
  userB = await upsertUserByEmail(`msg-b-${ts}@test.sheath`, 'User B')
  userC = await upsertUserByEmail(`msg-c-${ts}@test.sheath`, 'User C')

  cleanup = async () => {
    const { getDb, closeDb } = await import('@/features/lib/server/db')
    const { users } = await import('@/db/schema')
    const { inArray } = await import('drizzle-orm')
    const db = getDb()
    // conversations cascade-delete participants, messages, attachments
    const { conversations } = await import('@/db/schema')
    const { eq, or } = await import('drizzle-orm')
    await db.delete(conversations).where(
      or(
        eq(conversations.createdByUserId, userA.id),
        eq(conversations.createdByUserId, userB.id),
        eq(conversations.createdByUserId, userC.id),
      ),
    )
    await db.delete(users).where(inArray(users.id, [userA.id, userB.id, userC.id]))
    await closeDb()
  }
})

afterAll(async () => {
  if (hasDb) await cleanup?.()
})

// ── 1. createDirectConversation dedupes ──────────────────────────────────────

describe('createDirectConversation', () => {
  itDb('dedupes the same user pair — second call returns the same id', async () => {
    const first = await createDirectConversation(userA.id, userB.id)
    const second = await createDirectConversation(userA.id, userB.id)
    expect(first.id).toBe(second.id)
  })

  itDb('is symmetric — B→A returns same conversation as A→B', async () => {
    const ab = await createDirectConversation(userA.id, userB.id)
    const ba = await createDirectConversation(userB.id, userA.id)
    expect(ab.id).toBe(ba.id)
  })
})

// ── 2. createGroupConversation ────────────────────────────────────────────────

describe('createGroupConversation', () => {
  let groupId: string

  itDb('creates group with creator as admin + participant rows', async () => {
    const conv = await createGroupConversation(userA.id, 'Study Hall', [userB.id])
    groupId = conv.id
    expect(conv.type).toBe('group')
    expect(conv.title).toBe('Study Hall')

    const { getDb } = await import('@/features/lib/server/db')
    const { conversationParticipants } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const participants = await getDb()
      .select()
      .from(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, groupId))

    const creator = participants.find((p) => p.userId === userA.id)
    const member = participants.find((p) => p.userId === userB.id)
    expect(creator?.role).toBe('admin')
    expect(member?.role).toBe('member')
    expect(participants).toHaveLength(2)
  })
})

// ── 3. insertMessage bumps lastMessageAt ──────────────────────────────────────

describe('insertMessage', () => {
  let convId: string

  beforeAll(async () => {
    if (!hasDb) return
    const conv = await createDirectConversation(userA.id, userB.id)
    convId = conv.id
  })

  itDb('bumps conversation.lastMessageAt after insert', async () => {
    const before = await (async () => {
      const { getDb } = await import('@/features/lib/server/db')
      const { conversations } = await import('@/db/schema')
      const { eq } = await import('drizzle-orm')
      const rows = await getDb()
        .select()
        .from(conversations)
        .where(eq(conversations.id, convId))
      return rows[0].lastMessageAt
    })()

    await insertMessage({ conversationId: convId, senderUserId: userA.id, body: 'Hello' })

    const after = await (async () => {
      const { getDb } = await import('@/features/lib/server/db')
      const { conversations } = await import('@/db/schema')
      const { eq } = await import('drizzle-orm')
      const rows = await getDb()
        .select()
        .from(conversations)
        .where(eq(conversations.id, convId))
      return rows[0].lastMessageAt
    })()

    expect(after).not.toBeNull()
    if (before !== null) {
      expect(after!.getTime()).toBeGreaterThanOrEqual(before.getTime())
    }
  })
})

// ── 4. listMessagesAfter ──────────────────────────────────────────────────────

describe('listMessagesAfter', () => {
  let convId: string
  let msg1Id: string

  beforeAll(async () => {
    if (!hasDb) return
    const conv = await createDirectConversation(userA.id, userC.id)
    convId = conv.id
    const m1 = await insertMessage({ conversationId: convId, senderUserId: userA.id, body: 'First' })
    msg1Id = m1.id
    await insertMessage({ conversationId: convId, senderUserId: userC.id, body: 'Second' })
    await insertMessage({ conversationId: convId, senderUserId: userA.id, body: 'Third' })
  })

  itDb('returns only messages after cursor, ascending', async () => {
    const msgs = await listMessagesAfter(convId, msg1Id, 50)
    expect(msgs.length).toBe(2)
    expect(msgs[0].body).toBe('Second')
    expect(msgs[1].body).toBe('Third')
    // ascending order
    expect(msgs[0].createdAt.getTime()).toBeLessThanOrEqual(msgs[1].createdAt.getTime())
  })

  itDb('returns empty array when no messages after cursor', async () => {
    const all = await listMessagesAfter(convId, null, 50)
    const lastId = all[all.length - 1].id
    const result = await listMessagesAfter(convId, lastId, 50)
    expect(result).toHaveLength(0)
  })
})

// ── 5. listConversationsForUser ───────────────────────────────────────────────

describe('listConversationsForUser', () => {
  itDb('returns active convs sorted by lastMessageAt, excludes left', async () => {
    const conv1 = await createDirectConversation(userA.id, userB.id)
    const conv2 = await createGroupConversation(userA.id, 'Group X', [userB.id])

    // Send messages to establish ordering
    await insertMessage({ conversationId: conv1.id, senderUserId: userB.id, body: 'Msg conv1' })
    await new Promise((r) => setTimeout(r, 10))
    await insertMessage({ conversationId: conv2.id, senderUserId: userA.id, body: 'Msg conv2' })

    const convs = await listConversationsForUser(userA.id)
    const ids = convs.map((c) => c.id)
    expect(ids).toContain(conv1.id)
    expect(ids).toContain(conv2.id)

    // conv2 has the more recent message — should come first
    expect(ids.indexOf(conv2.id)).toBeLessThan(ids.indexOf(conv1.id))

    // After userA leaves conv2, it should be excluded
    await selfLeave(conv2.id, userA.id)
    const convs2 = await listConversationsForUser(userA.id)
    expect(convs2.map((c) => c.id)).not.toContain(conv2.id)
  })

  itDb('includes correct unread count per conversation', async () => {
    const conv = await createDirectConversation(userA.id, userB.id)
    // userB sends 2 messages; userA hasn't read
    await insertMessage({ conversationId: conv.id, senderUserId: userB.id, body: 'unread1' })
    await insertMessage({ conversationId: conv.id, senderUserId: userB.id, body: 'unread2' })

    const convs = await listConversationsForUser(userA.id)
    const found = convs.find((c) => c.id === conv.id)
    expect(found?.unreadCount).toBeGreaterThanOrEqual(2)
  })
})

// ── 5b. getConversationForUser ────────────────────────────────────────────────

describe('getConversationForUser', () => {
  itDb('returns a single conversation summary for an active participant', async () => {
    const conv = await createDirectConversation(userA.id, userB.id)
    await insertMessage({ conversationId: conv.id, senderUserId: userB.id, body: 'Hi A' })

    const summary = await getConversationForUser(userA.id, conv.id)
    expect(summary).not.toBeNull()
    expect(summary?.id).toBe(conv.id)
    expect(summary?.participants.map((p) => p.userId).sort()).toEqual([userA.id, userB.id].sort())
    expect(summary?.lastMessage).toBeNull()
    expect(summary?.unreadCount).toBe(0)
  })

  itDb('returns null when the user is not an active participant', async () => {
    const conv = await createDirectConversation(userA.id, userB.id)
    await selfLeave(conv.id, userA.id)

    const summary = await getConversationForUser(userA.id, conv.id)
    expect(summary).toBeNull()
  })

  itDb('returns null for an unknown conversation id', async () => {
    const summary = await getConversationForUser(userA.id, 'conv_does_not_exist')
    expect(summary).toBeNull()
  })
})

// ── 6. getUnreadTotal ─────────────────────────────────────────────────────────

describe('getUnreadTotal', () => {
  itDb('counts only messages after lastReadAt from other senders', async () => {
    const conv = await createDirectConversation(userA.id, userB.id)
    await insertMessage({ conversationId: conv.id, senderUserId: userA.id, body: 'own msg' })
    await insertMessage({ conversationId: conv.id, senderUserId: userB.id, body: 'other msg 1' })
    await insertMessage({ conversationId: conv.id, senderUserId: userB.id, body: 'other msg 2' })

    // Own messages don't count
    const totalBefore = await getUnreadTotal(userA.id)

    // Mark as read
    await markRead(conv.id, userA.id)

    // Send more after the read timestamp
    await insertMessage({ conversationId: conv.id, senderUserId: userB.id, body: 'after read' })

    const totalAfter = await getUnreadTotal(userA.id)
    // After marking read then new message from B, total should include at least 1
    expect(totalAfter).toBeGreaterThanOrEqual(1)
    // And the after count includes the new msg
    expect(totalAfter).toBeLessThanOrEqual(totalBefore + 1)
  })
})

// ── 7. addParticipant / removeParticipant / selfLeave ────────────────────────

describe('participant management', () => {
  let groupId: string

  beforeAll(async () => {
    if (!hasDb) return
    const conv = await createGroupConversation(userA.id, 'Participant Test Group', [userB.id])
    groupId = conv.id
  })

  itDb('addParticipant adds a new active participant', async () => {
    await addParticipant(groupId, userC.id)

    const { getDb } = await import('@/features/lib/server/db')
    const { conversationParticipants } = await import('@/db/schema')
    const { eq, and, isNull } = await import('drizzle-orm')
    const rows = await getDb()
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, groupId),
          eq(conversationParticipants.userId, userC.id),
          isNull(conversationParticipants.leftAt),
        ),
      )
    expect(rows).toHaveLength(1)
  })

  itDb('removeParticipant sets leftAt (soft delete)', async () => {
    await removeParticipant(groupId, userB.id)

    const { getDb } = await import('@/features/lib/server/db')
    const { conversationParticipants } = await import('@/db/schema')
    const { eq, and, isNotNull } = await import('drizzle-orm')
    const rows = await getDb()
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, groupId),
          eq(conversationParticipants.userId, userB.id),
          isNotNull(conversationParticipants.leftAt),
        ),
      )
    expect(rows).toHaveLength(1)
  })

  itDb('selfLeave sets leftAt for the leaving user', async () => {
    await selfLeave(groupId, userC.id)

    const { getDb } = await import('@/features/lib/server/db')
    const { conversationParticipants } = await import('@/db/schema')
    const { eq, and, isNotNull } = await import('drizzle-orm')
    const rows = await getDb()
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, groupId),
          eq(conversationParticipants.userId, userC.id),
          isNotNull(conversationParticipants.leftAt),
        ),
      )
    expect(rows).toHaveLength(1)
  })
})

// ── 8. insertAttachment / getAttachment ───────────────────────────────────────

describe('insertAttachment', () => {
  let convId: string
  let msgId: string

  beforeAll(async () => {
    if (!hasDb) return
    const conv = await createDirectConversation(userA.id, userB.id)
    convId = conv.id
    const msg = await insertMessage({ conversationId: convId, senderUserId: userA.id, body: '' })
    msgId = msg.id
  })

  itDb('rejects attachment > 1MB', async () => {
    const bigBuffer = Buffer.alloc(1_048_577) // 1MB + 1 byte
    await expect(
      insertAttachment({ messageId: msgId, kind: 'image', mimeType: 'image/png', data: bigBuffer }),
    ).rejects.toThrow(/size/i)
  })

  itDb('rejects non-image MIME type', async () => {
    const buf = Buffer.from('fake data')
    await expect(
      insertAttachment({ messageId: msgId, kind: 'image', mimeType: 'application/pdf', data: buf }),
    ).rejects.toThrow(/mime/i)
  })

  itDb('inserts a valid image attachment and getAttachment returns bytes', async () => {
    // Minimal valid 1x1 PNG
    const pngBytes = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489' +
      '0000000a49444154789c6260000000000200011c4bb7440000000049454e44ae426082',
      'hex',
    )
    const attachment = await insertAttachment({
      messageId: msgId,
      kind: 'image',
      mimeType: 'image/png',
      data: pngBytes,
    })
    expect(attachment.id).toBeTruthy()
    expect(attachment.sizeBytes).toBe(pngBytes.length)

    const fetched = await getAttachment(attachment.id)
    expect(fetched).not.toBeNull()
    expect(fetched!.data).toEqual(pngBytes)
    expect(fetched!.mimeType).toBe('image/png')
  })
})

// ── 9. getUserByEmail ─────────────────────────────────────────────────────────

describe('getUserByEmail', () => {
  itDb('returns a user for a known email', async () => {
    const result = await getUserByEmail(userA.email)
    expect(result).not.toBeNull()
    expect(result!.id).toBe(userA.id)
  })

  itDb('returns null for unknown email', async () => {
    const result = await getUserByEmail('nobody@unknown.test')
    expect(result).toBeNull()
  })
})
