# Database seeding

## Hard rule

**Never seed row-by-row.** Do not call repository upserts or issue one `INSERT` per row in a loop.

Demo and bulk seed data must use one of:

1. **Bulk multi-row INSERT** — build rows in memory, load in chunks (current approach).
2. **SQL dump** — `psql $DATABASE_URL < db/seed/….sql` for frozen snapshots.

Row-by-row seeding (thousands of round trips) is forbidden. It is slow, looks hung, and is hard to re-run safely.

---

## Demo households (`npm run db:seed:demo`)

Creates two rich demo families:

| Household | User | Learners |
|-----------|------|----------|
| Barakah Academy | `DEV_SEED_USER_EMAIL` (dev bypass) | 5 |
| Crescent Cove Learning | `DEMO_PARENT_B_EMAIL` (default `amina@gmail.com`) | 3 |

Each household gets **150 days** of history through **today** (rolling anchor). Barakah Academy (5 learners, high engagement) and Crescent Cove (3 learners, lighter schedule) use **different per-learner profiles** — not shared modulo loops.

### Workflow

```bash
# 1. Wipe (required before re-seed)
npm run db:wipe

# 2. Bulk seed (~seconds, not minutes)
npm run db:seed:demo
```

Or in one step:

```bash
npm run db:reset:demo
```

**Always wipe before re-seeding.** The demo loader uses `ON CONFLICT DO NOTHING`. It does not update existing rows. Re-seeding without a wipe leaves stale data in place.

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
2. **Load** — one transaction, ~12 table loads, each table 1–6 chunked INSERTs (~5s for ~2,300 rows).

Stable IDs live in `features/lib/seedIds.ts`.

### Changing demo data

Edit `scripts/seed/buildPayload.ts` (history logic) or `scripts/seed/demoConfig.ts` (learners/subjects). Then:

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
