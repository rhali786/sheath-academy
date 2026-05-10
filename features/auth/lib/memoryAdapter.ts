import { randomUUID } from 'crypto'
import type { Adapter, AdapterUser, VerificationToken } from '@auth/core/adapters'

const users = new Map<string, AdapterUser>()
const tokens = new Map<string, VerificationToken>()

/** Wipe all state — used in tests between cases. */
export function clearAdapterState() {
  users.clear()
  tokens.clear()
}

export const memoryAdapter: Adapter = {
  async createUser(user) {
    const id = randomUUID()
    const newUser: AdapterUser = { ...user, id }
    users.set(id, newUser)
    return newUser
  },

  async getUser(id) {
    return users.get(id) ?? null
  },

  async getUserByEmail(email) {
    for (const user of users.values()) {
      if (user.email === email) return user
    }
    return null
  },

  async updateUser(user) {
    const existing = users.get(user.id)
    if (!existing) throw new Error(`User ${user.id} not found`)
    const updated: AdapterUser = { ...existing, ...user }
    users.set(user.id, updated)
    return updated
  },

  async getUserByAccount() {
    return null
  },

  async linkAccount() {
    return undefined
  },

  async createVerificationToken(verificationToken) {
    tokens.set(verificationToken.token, verificationToken)
    return verificationToken
  },

  async useVerificationToken({ identifier, token }) {
    const stored = tokens.get(token)
    if (!stored) return null
    if (stored.identifier !== identifier) return null
    tokens.delete(token)
    return stored
  },
}
