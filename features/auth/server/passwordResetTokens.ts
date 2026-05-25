import { createHash, randomBytes } from 'crypto'
import { eq, and, gt, isNull } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { passwordResetTokens } from '@/db/schema'

const TOKEN_BYTES = 32
const EXPIRES_MS = 60 * 60 * 1000 // 1 hour

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

/** Creates a reset token, stores only the hash. Returns the raw token (send to user, never log). */
export async function createResetToken(userId: string): Promise<string> {
  const raw = randomBytes(TOKEN_BYTES).toString('hex')
  const now = new Date()
  await getDb()
    .insert(passwordResetTokens)
    .values({
      id: `prt_${Date.now()}_${randomBytes(4).toString('hex')}`,
      userId,
      tokenHash: hashToken(raw),
      expiresAt: new Date(now.getTime() + EXPIRES_MS),
      createdAt: now,
    })
  return raw
}

/** Validates the raw token; returns the userId if valid. Marks the token used (single-use). */
export async function useResetToken(rawToken: string): Promise<string | null> {
  const db = getDb()
  const hash = hashToken(rawToken)
  const now = new Date()

  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, hash),
        gt(passwordResetTokens.expiresAt, now),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .limit(1)

  if (!rows[0]) return null

  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(eq(passwordResetTokens.id, rows[0].id))

  return rows[0].userId
}

/** Checks if a raw token is valid without consuming it (for reset-password page validation). */
export async function isResetTokenValid(rawToken: string): Promise<boolean> {
  const hash = hashToken(rawToken)
  const now = new Date()
  const rows = await getDb()
    .select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, hash),
        gt(passwordResetTokens.expiresAt, now),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .limit(1)
  return rows.length > 0
}
