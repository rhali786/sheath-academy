import { createHash, randomBytes } from 'crypto'

const TOKEN_BYTES = 32
const EXPIRES_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function hashInvitationToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

export function createInvitationToken(): { raw: string; hash: string; expiresAt: Date } {
  const raw = randomBytes(TOKEN_BYTES).toString('hex')
  return {
    raw,
    hash: hashInvitationToken(raw),
    expiresAt: new Date(Date.now() + EXPIRES_MS),
  }
}
