# Plan: Feature 01 — Parent Account Sign-In (Magic Link)

## Context

Sheath Academy is a homeschool management dashboard. Currently every page is publicly accessible — no identity, no protection. Feature 01 gates the entire app behind a sign-in so household data is only visible to the parent/admin.

Primary login method: **email magic link** (passwordless). No password to remember; user receives a link by email and clicks it. Google/Facebook OAuth buttons will appear on the login page as future options but are not wired up yet.

This plan will also be written to `features/feature-01-parent-account-sign-in_todo/PLAN.md` during implementation.

---

## Key Constraints (from feedback)

1. **Features-first architecture**: All logic lives in `features/`. `app/` is a thin routing/import layer.
2. **Header moves out of dashboard**: It will be used on non-dashboard pages, so it belongs in a shared layout feature.
3. **Email magic link primary**: Use NextAuth.js v5 Email provider. Google/Facebook shown on login page as placeholders.

---

## Library Choice: NextAuth.js v5 (`next-auth@beta`)

- First-class Next.js 15 App Router support
- Built-in Email provider (magic link flow)
- OAuth providers (Google, Facebook) drop-in when credentials are ready
- JWT sessions — no database needed for session cookies
- **Email provider does need token storage** — solved with a lightweight in-memory adapter (consistent with the rest of the app's in-memory architecture)

**Email delivery:** **Resend** (`resend` npm package) — simple API, generous free tier, recommended in NextAuth v5 docs. One env var (`RESEND_API_KEY`).

---

## Token Storage Strategy

NextAuth's Email provider requires a database adapter to store one-time verification tokens. Instead of adding a full database, we implement a **minimal in-memory adapter** (`features/auth/lib/memoryAdapter.ts`) that satisfies only the token operations NextAuth needs:

- `createVerificationToken` — stores token in a `Map` with expiry
- `useVerificationToken` — retrieves and **deletes** the token (single-use enforced)
- All other adapter methods (user, session, account) are stubs — JWT handles sessions

**Caveat:** tokens are lost on server restart (user just requests a new link). Acceptable for MVP single-family app.

---

## Assumptions

1. App is at `sheathacademy.onrender.com` (confirmed in README).
2. JWT (stateless cookie) sessions — no user table or persistence needed for MVP.
3. All pages except `/login` and `/api/auth/*` require authentication.
4. `/api/health` stays public so CI smoke tests don't break.
5. Any email address can sign in for now (no allow-list). Can add one later via NextAuth `signIn` callback.

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Open sign-in (any email can access) | Acceptable for MVP; add email allow-list in `signIn` callback later |
| `AUTH_SECRET` not set in Render | App throws at startup — document clearly |
| Resend API key not set | Magic link send fails — document clearly |
| Tokens lost on server restart | User requests a new link — acceptable |
| Single Render instance only (in-memory tokens) | Fine for now; swap adapter for DB adapter when scaling |
| Facebook/Google shown but not wired | Buttons are visually present, disabled/greyed, with "coming soon" note |

---

## New Directory Structure

```
features/
  auth/                                  ← new feature
    auth.ts                              ← NextAuth config (providers, adapter, pages)
    lib/
      memoryAdapter.ts                   ← minimal in-memory NextAuth adapter
      sendMagicLinkEmail.ts             ← Resend email helper
    front/
      pages/
        Login.tsx                        ← login UI (magic link form + OAuth placeholders)

  layout/                                ← new shared layout feature
    front/
      components/
        Header.tsx                       ← moved + updated from dashboard/front/components/
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `features/auth/auth.ts` | NextAuth config |
| `features/auth/lib/memoryAdapter.ts` | In-memory token adapter |
| `features/auth/lib/sendMagicLinkEmail.ts` | Resend email helper |
| `features/auth/front/pages/Login.tsx` | Login page component |
| `features/layout/front/components/Header.tsx` | Shared header (moved from dashboard) |
| `app/login/page.tsx` | Thin wrapper — imports Login from features/auth |
| `app/login/layout.tsx` | Minimal layout for login page (no nav) |
| `app/api/auth/[...nextauth]/route.ts` | Thin handler — re-exports from features/auth |
| `middleware.ts` (project root) | Route protection |
| `features/feature-01-parent-account-sign-in_todo/PLAN.md` | This plan, in the feature dir |

## Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add `next-auth@beta` and `resend` |
| `app/layout.tsx` | Add `SessionProvider` wrapper |
| `features/dashboard/front/pages/Dashboard.tsx` | Update Header import to `features/layout` |
| `features/dashboard/front/components/Header.tsx` | Delete (or re-export from new location) |

---

## Implementation Steps

### 1. Install dependencies
```bash
npm install next-auth@beta resend
```

### 2. `features/auth/lib/memoryAdapter.ts`
Minimal NextAuth adapter — only `createVerificationToken` and `useVerificationToken` are real; everything else is a stub so JWT handles sessions.

```ts
const tokens = new Map<string, { identifier: string; expires: Date; token: string }>()

export const memoryAdapter = {
  createVerificationToken: async (token) => { tokens.set(token.token, token); return token },
  useVerificationToken: async ({ token }) => {
    const t = tokens.get(token)
    if (!t) return null
    tokens.delete(token)
    return t
  },
  // JWT handles sessions — stubs below satisfy NextAuth's type requirements
  createUser: async (u) => ({ ...u, id: crypto.randomUUID() }),
  getUser: async () => null,
  getUserByEmail: async () => null,
  getUserByAccount: async () => null,
  updateUser: async (u) => u,
  linkAccount: async () => null,
  createSession: async (s) => s,
  getSessionAndUser: async () => null,
  updateSession: async () => null,
  deleteSession: async () => null,
}
```

### 3. `features/auth/lib/sendMagicLinkEmail.ts`
Wraps Resend to send the magic link. NextAuth calls this as `sendVerificationRequest`.

```ts
import { Resend } from "resend"

export async function sendMagicLinkEmail({ identifier: email, url }) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: "Sheath Academy <no-reply@sheathacademy.com>",
    to: email,
    subject: "Your sign-in link for Sheath Academy",
    html: `<p>Click to sign in: <a href="${url}">${url}</a></p><p>Link expires in 15 minutes.</p>`,
  })
}
```

### 4. `features/auth/auth.ts`
```ts
import NextAuth from "next-auth"
import Email from "next-auth/providers/nodemailer"  // or resend provider
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import { memoryAdapter } from "./lib/memoryAdapter"
import { sendMagicLinkEmail } from "./lib/sendMagicLinkEmail"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: memoryAdapter,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    {
      id: "resend",
      type: "email",
      sendVerificationRequest: sendMagicLinkEmail,
    },
    Google,    // only active when GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET are set
    Facebook,  // only active when AUTH_FACEBOOK_ID + AUTH_FACEBOOK_SECRET are set
  ],
})
```

### 5. `app/api/auth/[...nextauth]/route.ts` (thin)
```ts
import { handlers } from "@/features/auth/auth"
export const { GET, POST } = handlers
```

### 6. `middleware.ts` (project root)
```ts
import { auth } from "@/features/auth/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
})

export const config = {
  matcher: ["/((?!api/auth|api/health|login|_next/static|_next/image|favicon.ico).*)"],
}
```

### 7. `features/layout/front/components/Header.tsx`
Move existing `features/dashboard/front/components/Header.tsx` here. Add auth-aware section:
- Use `useSession()` (already a client component)
- When signed in: show user email + "Sign out" button (calls `signOut()`)
- When not signed in: show "Sign in" link → `/login`
- Keep all existing nav tabs / mobile menu logic intact

### 8. `features/auth/front/pages/Login.tsx`
- Branded to Sheath Academy design (forest green, `.card` class, Inter)
- Email input + "Send magic link" button (submits to NextAuth Email provider)
- Divider: "or continue with"
- Google button (disabled/greyed, tooltip "Coming soon")
- Facebook button (disabled/greyed, tooltip "Coming soon")
- Success state: "Check your email — we sent a link to [email]"

### 9. `app/login/page.tsx` + `app/login/layout.tsx` (thin)
- `page.tsx` imports and renders `Login.tsx` from features/auth
- `layout.tsx` is a bare layout with no Header (avoids nav on login page)

### 10. Update `app/layout.tsx`
- Import `SessionProvider` from `next-auth/react`
- Wrap `{children}` in `<SessionProvider>`

### 11. Update dashboard Header import
- `features/dashboard/front/pages/Dashboard.tsx`: change import from `../components/Header` → `@/features/layout/front/components/Header`
- Delete (or leave as re-export) `features/dashboard/front/components/Header.tsx`

---

## Environment Variables

### Local `.env.local` (never commit)
```
AUTH_SECRET=<openssl rand -base64 32>
RESEND_API_KEY=<from resend.com dashboard>
# Optional — only needed when OAuth is configured:
# AUTH_GOOGLE_ID=...
# AUTH_GOOGLE_SECRET=...
# AUTH_FACEBOOK_ID=...
# AUTH_FACEBOOK_SECRET=...
```

### Render Dashboard
Set `AUTH_SECRET` and `RESEND_API_KEY` in the service's Environment tab.

---

## Resend Setup (one-time, manual)

1. Create free account at resend.com
2. Add and verify sending domain (or use `onboarding@resend.dev` for testing)
3. Create API key → paste into `RESEND_API_KEY`

---

## Verification

1. `npm run dev` → visit `/` → redirected to `/login`
2. Enter email → "Check your email" message shown
3. Click link in email → lands on dashboard, session active
4. Header shows user email + Sign out button
5. Sign out → redirected to `/login`
6. `curl localhost:3000/api/health` → 200 (not redirected)
7. `npm run build` → passes (no TS errors)
8. `npm test` → existing 33 tests still pass
9. `npm run smoke` → passes (`/api/health` public)
