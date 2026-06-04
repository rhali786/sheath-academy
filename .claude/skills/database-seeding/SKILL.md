---
name: database-seeding
description: Use when seeding, wiping, or modifying demo/test data for Sheath Academy. Covers the never-seed-row-by-row rule, the demo-household bulk seed (db:seed:demo / db:wipe / db:reset:demo), the build→load pipeline, and how to change demo data safely.
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
npm run db:wipe        # 1. Wipe (required before re-seed)
npm run db:seed:demo   # 2. Bulk seed (~seconds, not minutes)
# or, in one step:
npm run db:reset:demo
```

**Always wipe before re-seeding.** The demo loader uses `ON CONFLICT DO NOTHING` — it does not update existing rows. Re-seeding without a wipe leaves stale data in place.

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

Edit `scripts/seed/buildPayload.ts` (history logic) or `scripts/seed/demoConfig.ts` (learners/subjects), then:

```bash
npm run db:wipe && npm run db:seed:demo
```

Do not reintroduce per-row repository calls in seed scripts.

---

## Wipe

```bash
npm run db:wipe
```

Truncates all application tables (keeps schema/migrations). Equivalent SQL: `db/wipe_app_data.sql`.

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
| `scripts/db-wipe.ts` | Truncate helper |
| `scripts/check-db-seed.ts` | CI/local check that demo rows exist |
