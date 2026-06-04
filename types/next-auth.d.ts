import type { DefaultSession } from 'next-auth'

export interface SessionMembership {
  householdId: string
  householdName: string
  role: string
}

declare module 'next-auth' {
  interface Session {
    user: {
      email: string
      userId?: string
      householdId?: string
      timezone?: string
      isAdmin?: boolean
      memberships?: SessionMembership[]
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    email?: string
    userId?: string
    householdId?: string
    timezone?: string
    isAdmin?: boolean
    memberships?: SessionMembership[]
  }
}
