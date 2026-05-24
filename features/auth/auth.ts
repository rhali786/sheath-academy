import NextAuth from 'next-auth'
import type { Adapter } from '@auth/core/adapters'
import Resend from 'next-auth/providers/resend'
import Google from 'next-auth/providers/google'
import Facebook from 'next-auth/providers/facebook'
import Credentials from 'next-auth/providers/credentials'
import { getDevSeedUserEmail } from '@/features/lib/server/devUserEmail'

/** Lazy-load Postgres adapter so middleware (Edge) does not bundle `postgres`. */
function lazyDrizzleAdapter(): Adapter {
  let adapter: Adapter | undefined
  const getAdapter = (): Adapter => {
    if (!adapter) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      adapter = require('./lib/drizzleAdapter').drizzleAdapter as Adapter
    }
    return adapter
  }

  const bind = <K extends keyof Adapter>(method: K): NonNullable<Adapter[K]> =>
    ((...args: unknown[]) => {
      const fn = getAdapter()[method]
      if (typeof fn !== 'function') {
        throw new Error(`Adapter method ${String(method)} is not implemented`)
      }
      return (fn as (...a: unknown[]) => unknown).apply(getAdapter(), args)
    }) as NonNullable<Adapter[K]>

  // Methods must exist on the object itself — Auth.js validates at startup.
  return {
    createUser: bind('createUser'),
    getUser: bind('getUser'),
    getUserByEmail: bind('getUserByEmail'),
    updateUser: bind('updateUser'),
    getUserByAccount: bind('getUserByAccount'),
    linkAccount: bind('linkAccount'),
    createVerificationToken: bind('createVerificationToken'),
    useVerificationToken: bind('useVerificationToken'),
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: lazyDrizzleAdapter(),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  // Render (and most cloud hosts) terminate SSL at the load balancer;
  // trustHost lets NextAuth read X-Forwarded-Host correctly.
  trustHost: true,
  callbacks: {
    async signIn({ user, account }) {
      if (
        account?.provider &&
        account.provider !== 'resend' &&
        account.provider !== 'bypass' &&
        user.email &&
        process.env.DATABASE_URL
      ) {
        try {
          const { upsertUserByEmail } = await import('@/features/household/server/repository')
          await upsertUserByEmail(user.email, user.name ?? undefined)
        } catch {
          // Postgres optional during migration; JWT sign-in still succeeds.
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.email) {
        token.email = user.email
      }

      if (trigger === 'update' && session) {
        const patch = session as {
          userId?: string
          householdId?: string
          timezone?: string
        }
        if (patch.userId) token.userId = patch.userId
        if (patch.householdId) token.householdId = patch.householdId
        if (patch.timezone) token.timezone = patch.timezone
      }

      const email = user?.email ?? (typeof token.email === 'string' ? token.email : undefined)
      if (email && !token.householdId && process.env.DATABASE_URL) {
        try {
          const { resolveTenant } = await import('@/features/lib/server/tenant')
          const tenant = await resolveTenant({
            user: { email, name: user?.name ?? undefined },
          })
          token.userId = tenant.userId
          token.householdId = tenant.householdId
          token.timezone = tenant.timezone
        } catch {
          // Postgres optional during migration; session may lack tenant claims until DB is reachable.
        }
      }

      return token
    },
    session({ session, token }) {
      if (session.user) {
        if (typeof token.email === 'string') session.user.email = token.email
        if (typeof token.userId === 'string') session.user.userId = token.userId
        if (typeof token.householdId === 'string') session.user.householdId = token.householdId
        if (typeof token.timezone === 'string') session.user.timezone = token.timezone
      }
      return session
    },
  },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.AUTH_EMAIL_FROM ?? 'Sheath Academy <no-reply@sheathacademy.com>',
      // Override sendVerificationRequest to surface a clear error when the key is missing
      // rather than a silent 401 from Resend's API.
      sendVerificationRequest: async ({ identifier: to, url, provider }) => {
        if (!process.env.RESEND_API_KEY) {
          throw new Error(
            'RESEND_API_KEY is not configured. ' +
            'Add it in Render → Environment or .env.local (see .env.example).'
          )
        }
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: provider.from,
            to,
            subject: 'Sign in to Sheath Academy',
            html: `<p>Click to sign in: <a href="${url}">${url}</a></p><p>This link expires in 24 hours.</p>`,
            text: `Sign in to Sheath Academy\n\n${url}\n\nThis link expires in 24 hours.`,
          }),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            message?: string
            statusCode?: number
          }
          const detail = body.message ?? JSON.stringify(body)
          if (
            res.status === 403 &&
            typeof detail === 'string' &&
            detail.includes('only send testing emails')
          ) {
            throw new Error(
              'Resend testing mode: magic links can only be sent to the email on your Resend account. ' +
                'Use that address locally, or verify a domain at resend.com/domains.',
            )
          }
          throw new Error('Resend error: ' + JSON.stringify(body))
        }
      },
    }),

    // Dev-only bypass — active when DEV_BYPASS_SECRET is set in the environment.
    // Remove (or leave unset) in production to disable completely.
    ...(process.env.DEV_BYPASS_SECRET
      ? [
          Credentials({
            id: 'bypass',
            name: 'Dev bypass',
            credentials: {
              secret: { label: 'Secret', type: 'password' },
              email: { label: 'Email', type: 'email' },
            },
            async authorize(credentials) {
              if (credentials?.secret === process.env.DEV_BYPASS_SECRET) {
                const email =
                  typeof credentials.email === 'string' && credentials.email.trim()
                    ? credentials.email.trim()
                    : getDevSeedUserEmail()
                return {
                  id: email,
                  name: 'Dev Preview',
                  email,
                }
              }
              return null
            },
          }),
        ]
      : []),

    // OAuth — only registered when client id + secret are set (Auth.js reads AUTH_* env vars).
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google] : []),
    ...(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET ? [Facebook] : []),
  ],
})
