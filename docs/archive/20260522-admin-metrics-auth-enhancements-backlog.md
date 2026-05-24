# Admin metrics & auth — enhancement backlog

Captured from debug session 2026-05-22. These are **product improvements**, not blocking bugs. Do not mix with the auth/Resend fixes or seed cleanup work.

## Admin metrics (`/admin/metrics`)

| # | Item | Status | Notes |
|---|------|--------|--------|
| 1 | **Quran session not reflected in admin** | Open | Dev household has Fatiha session today; admin aggregates may not count `quran` feature area consistently with UI. |
| 2 | **By Areas vs table mismatch** | Open | e.g. Quran shows `2` in summary/by-area but `1` in per-user row — align aggregation rules and document what each number counts. |
| 3 | **Sessions column clarity** | Done (cards) | Cards label **Session events** with glossary; counts `session_*` + `lesson_completed` usage events. |
| 4 | **Learner names instead of count** | Done | Family cards show comma-separated names via admin API. |
| 5 | **Last active timestamp** | Done | Full date/time via `formatLastActive`. |
| 6 | **Drop-off glossary** | Done | “How to read these metrics” on `/admin/metrics` lists drop-off definitions. |
| 7 | **One household per user (product)** | Open | Postgres enforces `households.user_id` unique; admin “duplicate” rows are multiple **users** (dev + isolation seeds). Optional: hide test households from admin in dev. |

**Cards UI plan (2026-05):** searchable family cards, planner lesson counts, learner search — shipped.

## Quran UI

| # | Item | Status | Notes |
|---|------|--------|--------|
| 8 | **Child name on session list** | Open | Session list used to show learner name; restore in Quran sessions UI. |

## Auth (optional follow-ups)

| # | Item | Status | Notes |
|---|------|--------|--------|
| 9 | **OAuth redirect URIs doc** | Open | Document `http://localhost:3000/api/auth/callback/google` for local dev in `.env.example`. |
