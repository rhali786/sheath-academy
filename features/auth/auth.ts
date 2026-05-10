import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'
import Google from 'next-auth/providers/google'
import Facebook from 'next-auth/providers/facebook'
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
    }),
    // OAuth providers — activate by setting their env vars in Render / .env.local
    // AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET → Google sign-in becomes live
    Google,
    // AUTH_FACEBOOK_ID + AUTH_FACEBOOK_SECRET → Facebook sign-in becomes live
    Facebook,
  ],
})
