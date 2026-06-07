# Messaging feature — implementation plan

> Direct + group messaging between registered users, with hybrid discovery
> (household-member dropdown + email-to-DM), 3-second incremental polling,
> a normalized Postgres schema, and in-database image attachments.

---

## ▶ Execution kickoff (read first — fresh session)

This plan is self-contained; it was written so a cold session can execute it without the
original design dialogue. To start:

1. **Setup:** `npm install`, then `npm run setup-hooks` (once).
2. **Load skills before coding:** `testing-patterns`, `architecture-rules`, `ui-style-guide`.
3. **Branch:** `feature/messaging` off `dev`.
4. **Machine scope:** `docs/messaging-plan.json` lists, per phase, the `allowedFiles`
   globs, the named tests, and the commit message. Stay inside the current phase's
   `allowedFiles`.
5. **Per phase, in order (1→7):** write the failing tests first → implement →
   `npm run build` + `npm test` green → commit (no `--no-verify`).
6. **Before editing any file, read it** (CLAUDE.md pre-implementation audit). The
   "Code-path audit" section below tells you what was already traced and where the
   patterns live — but re-read the real type/schema files; do not trust this doc over code.

**Three findings that will trip you up if skipped:**
- Messaging is **user-scoped, not household-scoped** — build new
  `assertConversationParticipant` / `assertConversationAdmin` guards; do **not** reuse
  `assertOwnership` (it is household-entity based).
- The household-member dropdown reuses the **existing** `GET /api/household/members` at the
  **client** layer — no new server coupling.
- Drizzle pg-core has **no native `bytea`** — define `customType<{ data: Buffer }>()`.

---

## Summary

Build a new `features/messaging/` feature that lets any registered user message any
other registered user, one-to-one or in groups. Conversations are **user-scoped, not
household-scoped**. People are discovered two ways: (a) a dropdown of your household
members (so "message the teacher" is one click), and (b) typing the exact email of
someone outside your household. New messages arrive via a 3-second incremental poll that
appends only new messages to a keyed list — the rest of the screen stays static. Image
attachments (≤ 1 MB) are stored as `bytea` in a dedicated table and served through an
authenticated API route. The chat surface is built on `@chatscope/chat-ui-kit-react`,
restyled with Tailwind to match the forest design system. The already-present (disabled)
**Messages** nav item is enabled and its badge is wired to a live unread count.

Storage is **normalized rows**; the "easy-to-render JSON document" is produced by
**serializing the relational data at the API boundary**, not by persisting blobs. `jsonb`
is used only for bounded, co-written sub-objects (`conversation.settings`,
`message.reactions` reserved for later).

---

## Planning mode

**Mode 4 — New feature.** A substantial new capability with its own data model,
authorization rules, API surface, UI, and tests. It is *not* Mode 3 (cross-feature
dashboard composition): the only thing the rest of the app consumes from messaging is an
unread count in the nav badge.

---

## Confirmed product decisions (from dialogue)

| Decision | Choice |
|---|---|
| Conversation shapes | 1:1 **and** group threads |
| Discovery | Household-member dropdown **+** email-to-DM for outside-household users |
| Realtime | **Polling**, 3s on the open thread (no websockets in v1) |
| Storage model | Normalized rows; JSONB only for bounded fields; document-shaped API responses |
| Attachments | Images only, ≤ **1 MB**, stored as `bytea` in a separate table, served via API route |
| Chat UI | `@chatscope/chat-ui-kit-react` + Tailwind overrides |
| Group admin | Only an **admin** (creator by default) adds/removes others; any member may **self-leave** |
| Who can message | Registered account holders only (parents/teachers). Students are `learners` rows, not auth users. |

---

## Code-path audit (what exists today)

Traced against the live codebase, not memory:

1. **API routing** — `app/api/[...slug]/route.ts` dispatches `slug[0]` to per-feature
   `handle<Feature>Route(slug.slice(1), request)`. Auth context is resolved once in
   `dispatch()` via `requireAuthCtx` and made available through
   `runWithAuthCtx`/`getRequestAuthCtx` (AsyncLocalStorage). **Adding messaging = one new
   `if (slug[0] === 'messaging')` branch + a feature router.**
2. **Auth context** — `features/auth/server/context.ts` → `AuthCtx { userId, householdId,
   email?, timezone? }`. `getRequestAuthCtx()` returns it inside handlers.
   `assertOwnership(...)` is **household-entity** based (learner/lesson/attendance/…) — it
   does **not** fit messaging, which is participant-based. Messaging needs its **own**
   authorization guard.
3. **Schema** — `db/schema.ts` uses `text` PKs, `timestamp`, `jsonb` (already used by
   `school_years`, `user_settings`, `household_settings`), and composite indexes. **No
   `bytea` column exists yet** — Drizzle pg-core has no built-in `bytea`, so we define a
   `customType` (see Data changes).
4. **Closest analog feature — household** —
   - `features/household/server/repository.ts` already has `listMembersWithUsers(householdId)`
     (member dropdown source), `getUserById`, and an email lookup inside `upsertUserByEmail`.
   - `features/household/api/routes/invite.ts` shows the email + role + owner-guard pattern.
   - `features/household/api/router.ts` shows the slug→handler mapping convention.
   - `features/household/front/services/api.ts` shows the `get/post/put` fetch-wrapper client.
   - `GET /api/household/members` already returns members with user identity — the
     **household-dropdown discovery can call this existing endpoint at the client layer**
     (allowed cross-feature client import), avoiding any server coupling.
5. **Nav** — `features/layout/lib/navConfig.ts` already has a `messages` item
   (`disabled: true, showDisabledBadge: true`, static "3" badge in `Sidebar` `NavRow`), and
   `features/layout/lib/navIcons.tsx` maps `messages → MessageSquare`. **Enabling = flip
   config + replace the static badge with a live count.**
6. **Page wiring** — `app/(shell)/<route>/page.tsx` is a thin shell that renders a feature
   page component (see `app/(shell)/feedback/page.tsx`). Shell pages get Header + household
   context automatically.
7. **Existing tests** — none for messaging (new feature). Patterns to mirror live in
   `features/household/__tests__/` (repository integration, route handler) and the
   `testing-patterns` skill.

**Unknowns / assumptions stated, not filled:**
- Whether `@chatscope/chat-ui-kit-react` renders cleanly under jsdom or needs a Jest mock
  (like Nivo). **Plan: wrap the kit in thin local components; add a mock under
  `features/messaging/__tests__/mocks/` if it crashes in jsdom.** Verified during Phase 5.
- Exact Drizzle `bytea` ergonomics — resolved with `customType<{ data: Buffer }>`.

---

## Source-of-truth decision

The new **`messaging`** feature owns all messaging data:
`conversations`, `conversation_participants`, `messages`, `message_attachments`.

- It is **user-scoped**, keyed on `users.id`, *not* `households.id`. This is deliberate and
  matches the product decision that messaging is not household-bound.
- `users` is **shared infrastructure** (already referenced by every feature via FK). The
  messaging repository may **read** `users` directly for email lookup. It will **not** reach
  into the household feature's repository on the server.
- The **household-member dropdown** is sourced at the **client layer** from the existing
  `GET /api/household/members` endpoint — an allowed cross-feature client call, no new
  server coupling.
- The rest of the app consumes **only** an unread count from messaging (nav badge). The
  dashboard owns no messaging data and no messaging seed/store data is created.

---

## Architecture findings (per `architecture-rules`)

- **Type owner:** new domain types live in `features/messaging/types.ts`
  (`Conversation`, `ConversationSummary`, `Message`, `MessageAttachmentMeta`,
  `ConversationParticipant`, role/type unions). Nothing added to `features/lib/types.ts`
  except — if needed — reusing the existing `ApiResponse<T>`.
- **No duplicate types:** participant identity reuses `users` fields via join; we do not
  redefine a "user" type.
- **Import patterns:** same-feature imports relative; the one cross-feature touch
  (member dropdown) is a **client → API** call, matching the established pattern.
- **Data access:** UI → front service → API route → messaging service → messaging
  repository → Postgres. No raw store access; route handlers stay thin.
- **Postgres-ready:** already Postgres; `getDb()` never mocked in tests (repository
  integration tests skip without `DATABASE_URL`).
- **Authorization is feature-local:** messaging defines `assertConversationParticipant`
  and `assertConversationAdmin` rather than overloading household ownership.

---

## Why this schema (the JSONB question, settled)

The relational 3-(+1) table design is the **minimal** correct model, and it is what keeps
runtime simple:

- `conversation_participants` is a **many-to-many join**, not "just users." A user is in
  many conversations and a conversation has many users — SQL cannot model that without a
  join table. It is also the **only** place per-person state (`lastReadAt`, `role`,
  `leftAt`) can live.
- Messages are **append-heavy, concurrent, unbounded, and paginated** — the exact workload
  a single JSONB document handles worst (whole-row rewrites, write contention, latency that
  grows with history). So messages are rows, indexed `(conversationId, createdAt, id)`.
- The **document shape** the front end wants is produced by the **service** serializing rows
  into `{ conversation, participants[], messages[] }` at the API boundary — read-side
  convenience without write-side cost.
- `jsonb` is used **only** for bounded, co-written sub-objects: `conversation.settings`
  (and a reserved `message.reactions` for a later slice).

---

## Data / contract changes

### New tables (`db/schema.ts`)

```ts
// bytea custom type (Drizzle pg-core has no native bytea)
import { customType } from 'drizzle-orm/pg-core'
const bytea = customType<{ data: Buffer; default: false }>({
  dataType() { return 'bytea' },
})

conversations
  id              text pk
  type            text notnull            // 'direct' | 'group'
  title           text                    // null for direct
  createdByUserId text notnull -> users.id
  lastMessageAt   timestamp               // denormalized inbox-sort key, bumped on send
  settings        jsonb                   // bounded group settings (nullable)
  createdAt       timestamp notnull
  updatedAt       timestamp notnull
  index(lastMessageAt)

conversation_participants
  id             text pk
  conversationId text notnull -> conversations.id (onDelete cascade)
  userId         text notnull -> users.id (onDelete cascade)
  role           text notnull default 'member'   // 'admin' | 'member'
  lastReadAt     timestamp                        // drives unread; null = never read
  joinedAt       timestamp notnull
  leftAt         timestamp                        // soft self-leave; null = active
  unique(conversationId, userId)
  index(userId)
  index(conversationId)

messages
  id             text pk
  conversationId text notnull -> conversations.id (onDelete cascade)
  senderUserId   text notnull -> users.id
  body           text notnull default ''
  reactions      jsonb                            // reserved (no v1 UI)
  createdAt      timestamp notnull
  index(conversationId, createdAt, id)            // thread pagination + 'after' cursor

message_attachments
  id        text pk
  messageId text notnull -> messages.id (onDelete cascade)
  kind      text notnull            // 'image' (v1)
  mimeType  text notnull            // 'image/png' | 'image/jpeg' | 'image/webp'
  sizeBytes integer notnull         // enforced <= 1_048_576
  data      bytea notnull           // raw bytes
  createdAt timestamp notnull
  index(messageId)
```

Migration generated via `npm run db:generate`, applied with `npm run db:migrate`.
Wipe script (`db/wipe_app_data.sql`) updated to truncate the four new tables.

### API contract (all wrapped in the standard `ApiResponse<T>` shape)

| Method & path | Purpose |
|---|---|
| `GET /api/messaging/conversations` | Inbox: my active conversations + last message + unread count, sorted by `lastMessageAt` |
| `POST /api/messaging/conversations` | Start/open a **direct** conv (`{ userId }` or `{ email }`) — dedupes existing; or create a **group** (`{ title, participantUserIds[] }`) |
| `GET /api/messaging/conversations/:id` | Document-shaped thread: conversation + participants + first page of messages |
| `GET /api/messaging/conversations/:id/messages?after=<messageId>&limit=50` | Incremental fetch (poll) / older-page fetch |
| `POST /api/messaging/conversations/:id/messages` | Send a message (`{ body, attachment? }`, attachment = base64 + mime, ≤ 1 MB) |
| `POST /api/messaging/conversations/:id/read` | Mark read up to now (`lastReadAt = now`) |
| `POST /api/messaging/conversations/:id/participants` | **Admin only** — add participants |
| `DELETE /api/messaging/conversations/:id/participants/:userId` | **Admin only** remove; or **self** leave |
| `GET /api/messaging/unread` | Total unread across my active conversations (nav badge) |
| `GET /api/messaging/attachments/:id` | Stream attachment bytes (participant-guarded), `Content-Type: <mimeType>` |

---

## Authorization rules (feature-local guards)

- `assertConversationParticipant(conversationId, userId)` → throws 404/403 unless the user
  has an **active** (`leftAt IS NULL`) participant row. Required for: read thread, list
  messages, send message, mark read, fetch attachment.
- `assertConversationAdmin(conversationId, userId)` → requires `role = 'admin'`. Required
  for: add participant, remove **another** participant.
- **Self-leave** is allowed for any active participant (no admin check) — sets `leftAt`.
- **Direct** conversations: exactly two participants, no admin concept, cannot add
  participants (promoting a direct → group is out of scope v1).
- **Email discovery does not create users.** If the email matches no registered user, the
  API returns a friendly "no account found" — no invite in v1.
- Attachment route re-checks participant membership of the owning conversation before
  streaming bytes (no IDOR).

---

## Unread + polling mechanics

- **Unread per conversation** = `count(messages WHERE conversationId = c AND createdAt >
  participant.lastReadAt AND senderUserId <> me)` (null `lastReadAt` ⇒ all count).
- **Nav badge** = sum of per-conversation unread across my active participations,
  via `GET /api/messaging/unread`, polled every **15 s** (badge does not need 3 s).
- **Open thread** polls `GET …/messages?after=<lastMessageId>` every **3 s**; results are
  **appended** to a keyed list — existing message nodes never re-render (React
  reconciliation gives the "only the new bit changes" behavior without splitting the DOM).
- Opening a thread (and receiving new messages while focused) fires
  `POST …/read` to advance `lastReadAt`.

---

## UI plan (per `ui-style-guide`)

- **Route:** `app/(shell)/messages/page.tsx` (thin) → `MessagingPage` in
  `features/messaging/front/pages/`. Shell route ⇒ Header + household context automatic.
- **Layout:** two-pane — conversation list (left) + active thread (right); single-pane with
  back navigation on mobile (`md` breakpoint), matching existing responsive patterns.
- **Chat surface:** `@chatscope/chat-ui-kit-react` (`MessageList`, `Message`,
  `MessageInput`) wrapped in local components (`ThreadView`, `Composer`) carrying
  `data-testid`s; Tailwind/forest overrides on top of `@chatscope/chat-ui-kit-styles`.
- **New message modal:** styled modal (no `window.confirm`) with two tabs — "Household"
  (dropdown sourced from `GET /api/household/members`, current user filtered out) and
  "By email" (text input + lookup). Resolves to a direct conversation.
- **New group modal:** title + multi-select participants (household members and/or
  email-resolved users) → creates a group, creator = admin.
- **Group management:** admin sees add/remove controls; every member sees a **Leave**
  action with a styled confirm.
- **Attachments:** image picker in the composer; client-side guard rejects > 1 MB and
  non-image MIME before upload; sent images render via the attachment URL; thumbnails
  capped in CSS.
- **States:** loading (skeleton), empty ("No conversations yet — start one"), error
  (retry), populated. Icon-only actions carry `aria-label`s.

---

## Testing plan (failing tests first, per `testing-patterns`)

**Repository integration (`node`, skip without `DATABASE_URL`):**
1. `createDirectConversation` dedupes — second call for same user pair returns the same id.
2. `createGroupConversation` sets creator as `admin` + participant rows.
3. `insertMessage` bumps `conversation.lastMessageAt`.
4. `listMessagesAfter(convId, messageId)` returns only newer messages, ascending.
5. `listConversationsForUser` returns active convs sorted by `lastMessageAt` with correct
   per-conversation unread, excluding left conversations.
6. `getUnreadTotal` counts only messages after `lastReadAt` from **other** senders.
7. `addParticipant` / `removeParticipant` / `selfLeave` (`leftAt`) behave per rules.
8. `insertAttachment` rejects > 1 MB and non-image MIME; `getAttachment` returns bytes.
9. `getUserByEmail` returns a user (read-only) and `null` for unknown email.

**API route handlers (`node`, mock the messaging repository boundary):**
10. `POST /conversations` with `{ email }` to unknown user → friendly 404, no user created.
11. `POST /conversations/:id/messages` by a **non-participant** → 403/404.
12. `POST /participants` by a **non-admin** → 403.
13. `DELETE /participants/:self` by a member → 200 (self-leave allowed).
14. `GET /messages?after=` returns incremental payload shape.
15. `GET /attachments/:id` by a non-participant → 403/404; by a participant → bytes +
    correct `Content-Type`.
16. `GET /unread` returns `{ count }`.

**Integration (jsdom, mock context + messaging client):**
17. Conversation list renders loading / empty / error / populated.
18. Selecting a conversation renders the thread (populated) and fires mark-read.
19. Composer send calls the client and appends the message (optimistic/refetch).
20. New-message modal: household tab lists members; email tab shows "no account" on miss.
21. New-group modal: requires title + ≥ 1 participant; create calls the client.
22. Non-admin sees no add/remove controls but sees **Leave**.
23. Nav **Messages** badge shows the live unread count and hides at zero.

**Manual / browser:** chat-kit renders correctly in a real browser (Jest mocks UI kits);
3-second poll appends without full re-render; image attachment round-trips.

---

## Build phases (each yields a usable capability; TDD per phase)

1. **Schema + migration** — four tables, `bytea` custom type, wipe-script update. Repo
   integration tests #1–#9 written first (failing), then repository functions until green.
2. **Service layer + guards** — `assertConversationParticipant/Admin`, dedupe, unread math,
   self-leave; covered by repo tests + service unit tests.
3. **API routes + router wiring** — `features/messaging/api/router.ts`, route handlers,
   the `slug[0] === 'messaging'` branch in `app/api/[...slug]/route.ts`. Tests #10–#16.
4. **Front data layer** — `features/messaging/types.ts`, `front/services/api.ts` client,
   `front/context` + polling hooks (`useConversations`, `useThread`, `useUnreadMessages`).
5. **Front UI** — install `@chatscope/chat-ui-kit-react` + styles; `MessagingPage`,
   `ConversationList`, `ThreadView`, `Composer`, new-message + new-group modals,
   attachment picker/renderer; `app/(shell)/messages/page.tsx`. Tests #17–#22; resolve the
   Jest-mock question for the kit here.
6. **Nav enablement** — flip `messages` nav item to enabled (`href: '/messages'`,
   `activePrefixes: ['/messages']`), replace the static "3" with a live badge fed by
   `useUnreadMessages`. Test #23.
7. **Polish + QA** — empty/error states, mobile single-pane, Tailwind overrides,
   `npm run build` + `npm test` green, manual browser QA.

---

## Acceptance criteria (observable)

1. From **/messages**, clicking **New message → Household**, picking a member, and sending
   "Salam" creates a thread; the recipient, on their next 3-second poll, sees "Salam"
   appended **without the page reloading**.
2. **New message → By email** with a registered email opens/*reuses* a direct thread; with
   an unregistered email shows "No account found for that email" and creates nothing.
3. **New group** with a title and two participants creates a group where the creator is
   admin; the admin can add/remove others; a non-admin member cannot, but can **Leave**,
   after which they no longer see the conversation.
4. Sending a ≤ 1 MB image renders inline for all participants; a > 1 MB or non-image file is
   rejected client-side with a message.
5. The sidebar **Messages** item is clickable and shows a numeric unread badge that
   increments on new messages and disappears when the thread is read.
6. A user who is not a participant cannot load a thread, its messages, or its attachments
   (API returns 403/404).

---

## Out of scope (v1)

Websockets / typing indicators / presence; message edit & delete; reactions UI (column
reserved); read-receipt avatars (only unread counts); push or email notifications;
non-image attachments and object storage; inviting non-registered emails; converting a
direct thread into a group; global message search; per-message threading/replies.

---

## Manual QA (click-by-click)

1. Seed/login as two users in the **same** household (User A owner, User B teacher).
2. As A: open **/messages** → **New message** → **Household** tab → select User B → send
   "Assalamu alaikum". Confirm it appears in A's thread.
3. As B (second browser): open **/messages**, confirm the unread badge shows **1**, open
   the thread, confirm the message and that the badge clears within one poll.
4. As B: reply; confirm A's open thread appends the reply within ~3 s with no page reload.
5. As A: **New group**, title "Study Hall", add B + a third user by **email**; confirm
   creation and that A is admin.
6. As B (non-admin): confirm no add/remove controls; click **Leave**, confirm removal.
7. As A: attach a < 1 MB image, send; confirm inline render for B. Attempt a > 1 MB image;
   confirm client rejection.
8. As an unrelated user C: hit `GET /api/messaging/conversations/<A-B id>` directly;
   confirm 403/404.

---

## Branch + commit plan

Branch: `feature/messaging`

Behavior-oriented commits, one per phase:
1. `feat(messaging): schema + repository for conversations, messages, attachments`
2. `feat(messaging): service layer with participant/admin authorization`
3. `feat(messaging): REST routes + slug wiring`
4. `feat(messaging): front data layer + polling hooks`
5. `feat(messaging): chat UI, discovery + group modals, attachments`
6. `feat(messaging): enable Messages nav item with live unread badge`
7. `chore(messaging): empty/error/mobile polish + QA`

Each commit keeps `npm run build` + `npm test` green (pre-commit hook bumps the patch
version — never `--no-verify`).

---

## Risks + rollback

| Risk | Mitigation |
|---|---|
| `@chatscope/chat-ui-kit-react` crashes under jsdom | Wrap in local components; add a Jest mock under `features/messaging/__tests__/mocks/` (Nivo precedent) |
| `bytea` + 1 MB rows bloat hot queries | Attachments isolated in their own table; never selected in message/thread queries; served only on demand |
| 3 s poll load at scale | Incremental `after`-cursor returns mostly-empty payloads; badge polls at 15 s; swap to hosted realtime later **without schema change** |
| Cross-household privacy | Authorization is participant-based and re-checked on every read incl. attachments; messaging carries no household scope to leak |
| Direct-conversation duplication | `findDirectConversation` dedupe + covering test (#1) |

**Rollback:** the feature is additive and isolated. Reverting = drop the four tables
(migration down), remove the `messaging` slug branch, and re-disable the `messages` nav
item. No existing feature depends on messaging data.

---

## Re-derived sizing (vs. the ~32–44 h pre-plan estimate)

| Phase | Hours |
|---|---|
| 1 — Schema + repository + integration tests | 5–7 |
| 2 — Service layer + guards | 3–4 |
| 3 — API routes + wiring + handler tests | 4–5 |
| 4 — Front data layer + polling hooks | 4–5 |
| 5 — Chat UI + modals + attachments + integration tests | 9–13 |
| 6 — Nav enablement + live badge | 1–2 |
| 7 — Polish + QA + browser verification | 3–4 |
| **Total** | **~29–40 h** |

Lands just inside the pre-plan ~32–44 h band (slightly lower because the discovery dropdown
reuses the existing `/api/household/members` endpoint and attachments avoid an external
storage provider). Phase 5 remains the dominant cost and the most uncertain (chat-kit
restyling + Jest behavior).
