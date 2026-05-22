import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'
import Google from 'next-auth/providers/google'
import Facebook from 'next-auth/providers/facebook'
import Credentials from 'next-auth/providers/credentials'
import { getDevSeedUserEmail } from '@/features/lib/server/devUserEmail'
import { memoryAdapter } from './lib/memoryAdapter'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: memoryAdapter,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  // Render (and most cloud hosts) terminate SSL at the load balancer;
  // trustHost lets NextAuth read X-Forwarded-Host correctly.
  trustHost: true,
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
          const body = await res.json().catch(() => ({}))
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

    // OAuth providers — activate by setting their env vars in Render / .env.local.
    // AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET  → Google sign-in goes live.
    Google,
    // AUTH_FACEBOOK_ID + AUTH_FACEBOOK_SECRET → Facebook sign-in goes live.
    Facebook,
  ],
})
