import type { NextAuthConfig } from 'next-auth'

/**
 * Edge-safe Auth.js config — no Postgres adapter, no Node-only imports.
 * Used by middleware only. Full providers/adapter live in auth.ts.
 */
export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  trustHost: true,
  providers: [],
} satisfies NextAuthConfig
