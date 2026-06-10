---
name: database-seeding
description: Use when seeding or modifying demo/test data for Sheath Academy. Covers the never-seed-row-by-row rule, the demo-household bulk seed (db:seed:demo, empty-DB only), the build→load pipeline, why the wipe/reset scripts were removed, and how to change demo data safely.
---

# Database seeding

## Hard rule

**Never seed row-by-row.** Do not call repository upserts or issue one `INSERT` per row in a loop. Row-by-row seeding (thousands of round trips) is forbidden — slow, looks hung, hard to re-run safely.

Demo and bulk seed data must use one of:

1. **Bulk multi-row INSERT** — build rows in memory, load in chunks (current approach).
2. **SQL dump** — `psql $DATABASE_URL < db/seed/….sql` for frozen snapshots.

---

## Demo households (`npm run db:seed:demo`)

Creates two rich demo families:

| Household | User | Learners |
|-----------|------|----------|
| Barakah Academy | `DEV_SEED_USER_EMAIL` (dev bypass) | 5 |
| Crescent Cove Learning | `DEMO_PARENT_B_EMAIL` (default `amina@gmail.com`) | 3 |

Each household gets **150 days** of history through **today** (rolling anchor). The two households use **different per-learner profiles** — not shared modulo loops.

### Workflow

```bash
npm run db:seed:demo   # Bulk seed an EMPTY database (~seconds, not minutes)
```

⚠️ **Wipe/reset scripts (`db:wipe`, `db:reset:demo`, `db-wipe.ts`, `dev-drop-schema.ts`, `db/wipe_app_data.sql`) were removed on 2026-06-08** after `db:reset:demo` truncated the prod database (it ran against `.env.local`'s `DATABASE_URL`, which pointed at prod at the time). There is intentionally no in-repo command that truncates or drops data.

**Seeding only inserts** — the loader uses `ON CONFLICT DO NOTHING` and does not update existing rows, so re-seeding a non-empty DB is a no-op that leaves stale data in place. **For a clean re-seed, provision a fresh/empty database** (e.g. a new Render instance) and point `DATABASE_URL` at it. **Always verify `DATABASE_URL` is not prod (`sheath_academy` / `*oregon-postgres*`) before seeding.**

### How it works

```
scripts/seed-demo-households.ts     ← entry point
scripts/seed/demoConfig.ts          ← stable IDs + household definitions
scripts/seed/householdProfiles.ts   ← per-household learner behaviour profiles
scripts/seed/buildPayload.ts        ← pure in-memory row generation (no DB)
scripts/seed/loadPayload.ts         ← FK-ordered bulk INSERT in one transaction
scripts/seed/bulkInsert.ts          ← chunked INSERT helper (1000 rows/statement)
```

1. **Build** — loops run in JavaScript only; produce ~5k+ rows.
2. **Load** — one transaction, ~12 table loads, each 1–6 chunked INSERTs (~5s for ~2,300 rows).

Stable IDs live in `features/lib/seedIds.ts`.

### Changing demo data

Edit `scripts/seed/buildPayload.ts` (history logic) or `scripts/seed/demoConfig.ts` (learners/subjects), then run `npm run db:seed:demo` against a **fresh/empty** database (there is no wipe command — see above).

Do not reintroduce per-row repository calls in seed scripts. **Do not re-add a `db:wipe`/`db:reset` script without an enforced prod-host guard** (refuse `sheath_academy` / `*oregon-postgres*` unless an explicit override env is set).

---

## Tests and other seeds

- **Jest / integration tests** — mock at the repository boundary; use small fixtures, not the demo seed.
- **E2E isolation** — creates its own users via API; does not use `db:seed:demo`.

---

## Related files

| File | Purpose |
|------|---------|
| `db/schema.ts` | Table definitions |
| `features/lib/seedIds.ts` | Stable demo IDs |
| `scripts/check-db-seed.ts` | CI/local check that demo rows exist |
| `scripts/db-forensic.ts` | Read-only DB probe (row counts, timestamps) — SELECTs only |
