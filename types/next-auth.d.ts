import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      email: string
      userId?: string
      householdId?: string
      timezone?: string
      isAdmin?: boolean
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
  }
}
