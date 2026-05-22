# Development Plan — Product Validation ↔ Admin Metrics Alignment

Branch: `feature/product-validation-admin-alignment` (or continue on active feature branch)

Status: Planned — post–Wave 1 product validation + in-progress admin metrics

Related plans:

- `docs/bug_enhancement/20260522-1230-product-validation-form-plan.md` — feedback form (implemented, Wave 1 + integration)
- `docs/bug_enhancement/20260522-1135-admin-metrics-page-dev-plan.md` — Fork Test usage metrics (separate feature)
- `docs/bug_enhancement/20260522-1200-authentication-user-ownership-plan.md` — `AuthCtx`, household scoping
- `docs/bug_enhancement/20260522-1120-drizzle-postgres-persistence-migration.md` — Drizzle / Postgres foundation

---

## 1. Summary

Product validation and admin metrics are **already compatible** at the page and auth layers. No rework of the feedback wizard, `/feedback` route, or `/api/product-validation/*` slug is required for admin metrics to ship.

This plan covers **remaining alignment and polish** so both features stay consistent as admin metrics gains Postgres usage events, instrumentation, and the Fork Test table. It does **not** duplicate the admin-metrics page build (hero bar, usage table, event instrumentation) — that remains owned by `20260522-1135-admin-metrics-page-dev-plan.md`.

Goals:

1. One shared admin gate for all admin APIs and docs (`ADMIN_EMAIL`).
2. Remove duplicate forbidden/session boilerplate in product-validation routes.
3. Align persistence naming (`householdId`, not `tenantId`) before Postgres migration for validation responses.
4. Optionally migrate product-validation from memory store to Postgres using the existing `product_validation_responses` table.
5. Keep `/admin/metrics` as a **composition page** only — no merge of feature domains.

---

## 2. Planning Mode

Mode 3 — Cross-feature integration + small persistence alignment.

Reason: no new user-facing product surface; surgical server/shared-infra changes and optional repository migration. Admin metrics UI/API work continues in its own plan.

---

## 3. Current State Audit (as of plan date)

### `/admin/metrics` page

| Layer | Current behavior |
|--------|------------------|
| Route | `app/(shell)/admin/metrics/page.tsx` |
| Shell | `(shell)` + `AppShell` — requires sign-in |
| Page guard | `features/admin-metrics/front/components/AdminPageGuard.tsx` — probes `GET /api/admin/metrics/summary`; 403 → forbidden message |
| Sections | (1) `AdminMetricsDashboard` — usage metrics (2) `AdminValidationSummary` — product validation |
| Owner | Page composes two features; neither feature imports the other’s server stores |

**Aligned with** product-validation plan §11 and admin-metrics plan § Admin Route.

### Admin authorization

| Mechanism | Location | Env vars |
|-----------|----------|----------|
| `isAppAdmin(email)` | `features/lib/server/appAdmin.ts` | `ADMIN_EMAIL` (preferred), else `PRODUCT_VALIDATION_ADMIN_EMAIL` |
| Admin metrics APIs | `features/admin-metrics/server/requireAdminApi.ts` | Uses `isAppAdmin` |
| Product validation admin GETs | `features/product-validation/api/routes/responses.ts`, `summary.ts`, `responses-id.ts` | Uses `isProductValidationAdmin` → `isAppAdmin` |
| Page guard | `AdminPageGuard` | Same gate via admin-metrics summary API |

**Gap:** Product-validation routes duplicate `forbiddenResponse()` and manual `auth()` + email check instead of calling `requireAdminApi`.

### API routes (intentionally separate)

| Feature | Slug prefix | Purpose |
|---------|-------------|---------|
| Product validation | `/api/product-validation/responses`, `/summary` | POST feedback (any signed-in user with household); GET list/summary (admin) |
| Admin metrics | `/api/admin/metrics/summary`, `/users`, `/events` | Fork Test usage analytics (admin only) |

Both wired in `app/api/[...slug]/route.ts`. **Do not** move product-validation under `/api/admin/`.

### Persistence

| Entity | App runtime | DB schema |
|--------|-------------|-----------|
| Usage events | `features/admin-metrics/server/` (repository + memory fallback) | `usage_events` in `db/schema.ts` |
| Validation responses | `features/product-validation/server/store.ts` (memory only) | `product_validation_responses` in `db/schema.ts` with column `tenant_id` |

**Gap:** Types and service use `householdId`; Drizzle table still has `tenant_id`. Postgres migration for validation not implemented in service layer.

### Product validation — shipped (no change required for admin metrics)

- `features/product-validation/` — types, scoring, schema, service, API, wizard, tests
- `app/(auth)/feedback/page.tsx`, About CTA, middleware `feedback` exclude, login `callbackUrl`
- `e2e/product-validation.spec.ts` (basic flows)

### Admin metrics — owned by sibling plan

- Hero trends, per-household table, filters, instrumentation, Playwright for count changes
- Continue on `feature/admin-metrics-fork-test` per `20260522-1135-admin-metrics-page-dev-plan.md`

---

## 4. Source-of-Truth Decisions

| Concern | Owner | Rule |
|---------|--------|------|
| Usage events & Fork Test metrics | `features/admin-metrics/` | Admin metrics composes; does not read product-validation store |
| Validation responses & fit score | `features/product-validation/` | Admin metrics page only **renders** `AdminValidationSummary`; calls product-validation APIs |
| Admin email gate | `features/lib/server/appAdmin.ts` | Single function; env documented once |
| `householdId` on records | Auth / household model | Never `tenantId` in new TypeScript contracts |
| `/admin/metrics` layout | `app/(shell)/admin/metrics/page.tsx` | Thin composer; feature sections stay in feature folders |

Do not merge stores, types, or API routers between the two features.

---

## 5. What Does **Not** Need to Change

Document explicitly so implementers do not scope-creep:

- `/feedback` route group, wizard steps, or About CTA
- `POST /api/product-validation/responses` contract or scoring weights
- Product-validation API slug `product-validation`
- Moving validation admin UI to a standalone `/admin/product-validation` route
- Rebuilding admin metrics table inside product-validation
- Dashboard seed data for fake metrics or fake validation responses

---

## 6. Recommended Changes (this plan’s scope)

### 6.1 Shared admin API helper (DRY)

**Problem:** `requireAdminApi` exists in admin-metrics; product-validation copies the same 401/403 pattern.

**Decision:** Move admin API gate to shared infrastructure:

```txt
features/lib/server/requireAdminApi.ts   # new (or rename from admin-metrics)
```

- Export `requireAdminApi(request)` and `forbiddenResponse()` / reuse `unauthorizedResponse` from auth context.
- `features/admin-metrics/server/requireAdminApi.ts` re-exports or thin-wraps shared module (avoid breaking imports).
- Product-validation route handlers call shared `requireAdminApi` for GET list/summary/detail.
- Deprecate `features/product-validation/server/adminGuard.ts` re-export only; remove duplicate local `forbiddenResponse` in validation routes.

**Tests:** Extend `features/auth` or `features/lib` tests — admin email set → ok; unset → 403; wrong email → 403.

### 6.2 Environment variables (documentation + local setup)

**Problem:** Two env names (`ADMIN_EMAIL`, `PRODUCT_VALIDATION_ADMIN_EMAIL`) confuse operators.

**Decision:**

- **Canonical:** `ADMIN_EMAIL` in `.env.example` and Render docs.
- **Deprecated alias:** `PRODUCT_VALIDATION_ADMIN_EMAIL` still read by `isAppAdmin` until one release after docs update.
- CLAUDE.md Troubleshooting: one bullet for admin access to `/admin/metrics`.

**No commit** of `.env.local` values.

### 6.3 Schema ↔ TypeScript: `tenantId` → `householdId`

**Problem:** `db/schema.ts` `product_validation_responses.tenant_id` vs app `householdId`.

**Decision:**

- Drizzle column: `household_id` (references `households.id` when FK is added).
- Migration: rename column if table already deployed; otherwise generate migration with correct name only.
- Types: keep `householdId?: string` on `ProductValidationResponse`; remove `tenantId` from any new code.
- Service: persist `authCtx.householdId` on create (already done in memory path).

**Dependency:** Safe after auth household resolution is stable (`AuthCtx.householdId`).

### 6.4 Product-validation Postgres repository (optional phase)

**Problem:** Validation data is memory-only; schema table exists but unused — data lost on restart / multi-instance deploy.

**Decision:** Add `features/product-validation/server/repository.ts` mirroring admin-metrics pattern:

- `isPostgresMode()` → Drizzle insert/list; else memory store.
- Service functions unchanged at API boundary: `createProductValidationResponse`, `listProductValidationResponses`, `getProductValidationSummary`.
- IDs: keep `generateProductValidationResponseId()` or switch to UUID per DB migration plan.

**Out of this plan if** Postgres migration wave is not ready — document as Phase 3 optional.

### 6.5 UI redundancy (optional)

**Problem:** `AdminPageGuard` already blocks non-admins; `AdminValidationSummary` still fetches and shows its own 403 panel.

**Decision (pick one in implementation):**

- **A (preferred):** Keep summary 403 for direct API/debug; add comment in component that page guard is primary.
- **B:** If `AdminPageGuard` passed, assume admin for summary fetch; simplify error UI to load/empty only.

Low priority; no user-facing bug.

---

## 7. UI Pattern Audit

No new UI in this plan. Existing sections must remain:

| Section | Style guide | Tests |
|---------|-------------|-------|
| Usage metrics | App shell, table-first per admin-metrics plan | Existing admin-metrics integration tests |
| Product validation | Same page width as shell; Nivo only if charts added later | `AdminValidationSummary.test.tsx` |

---

## 8. End-to-End Data Flow (validation record)

| Step | Location |
|------|----------|
| ID generated | `features/product-validation/server/ids.ts` |
| Created | `createProductValidationResponse(authCtx, input, sessionEmail)` |
| Stored | Memory store today → `product_validation_responses` after Phase 3 |
| Admin list | `GET /api/product-validation/responses` → `requireAdminApi` |
| Admin UI | `AdminValidationSummary` → `productValidationApi.listResponses()` / `getSummary()` |
| Page reachability | Header not required; direct `/admin/metrics` URL; optional future nav link for admins only |

---

## 9. Acceptance Criteria

1. `ADMIN_EMAIL` documented as the single recommended admin config; both features respect it.
2. Product-validation admin GET routes use the same shared `requireAdminApi` as admin-metrics (no duplicated forbidden helpers).
3. `ProductValidationResponse` and DB column use `householdId` / `household_id` only — no new `tenantId` in TS.
4. `/admin/metrics` still shows both sections without cross-feature store imports.
5. `npm test` passes for product-validation, admin-metrics, and shared lib tests touched by the gate move.
6. (Phase 3) After Postgres migration, submitted feedback survives restart and appears in admin summary.

---

## 10. Build Phases

### Phase 0 — Confirm sibling work (no code)

- Admin metrics plan phases 1–6 proceeding on `features/admin-metrics/`.
- Product validation form and `/feedback` remain frozen unless a bug is found.
- Note active branch / merge order with auth ownership work.

**Exit:** Written sign-off in PR that this plan does not block admin-metrics table work.

### Phase 1 — Shared admin API gate + env docs

| Files (expected) | Change |
|------------------|--------|
| `features/lib/server/requireAdminApi.ts` | New shared gate |
| `features/admin-metrics/server/requireAdminApi.ts` | Delegate to lib |
| `features/product-validation/api/routes/*.ts` | Use shared gate |
| `.env.example`, `CLAUDE.md` | `ADMIN_EMAIL` canonical |
| Tests | API 401/403 parity for both slug families |

**Exit:** Tests green; duplicate `forbiddenResponse` removed from product-validation routes.

### Phase 2 — Schema / type alignment (`household_id`)

| Files (expected) | Change |
|------------------|--------|
| `db/schema.ts` | `household_id` on `product_validation_responses` |
| Drizzle migration | Generate/migrate per project DB workflow |
| `features/product-validation/types.ts` | Confirm no `tenantId` |
| Docs | Update product-validation plan appendix if needed |

**Exit:** Schema matches `AuthCtx.householdId`; memory path still works without Postgres.

### Phase 3 — Product-validation repository (optional)

| Files (expected) | Change |
|------------------|--------|
| `features/product-validation/server/repository.ts` | Drizzle + memory adapter |
| `features/product-validation/server/service.ts` | Call repository |
| Tests | Repository + API tests with Postgres mode mocked or test DB |

**Exit:** Create/list/summary work in Postgres mode; no API contract change.

### Phase 4 — UI polish (optional)

- Simplify `AdminValidationSummary` error states per §6.5 decision A or B.
- Optional: admin-only link to `/admin/metrics` in Header (env-gated client check or static “if you are admin” doc only).

**Exit:** Integration tests updated; manual QA on `/admin/metrics` as admin and non-admin.

---

## 11. Testing Plan

### Unit / API

- Shared `requireAdminApi`: 401 without session, 403 non-admin, 200 admin for:
  - `GET /api/admin/metrics/summary`
  - `GET /api/product-validation/summary`
- Regression: `POST /api/product-validation/responses` still 401 unsigned, 200 signed-in (not admin required).

### Integration

- `AdminPageGuard` + `AdminValidationSummary` still render together on mocked admin session.
- No regression on `ProductValidationWizard` or `FeedbackPage` tests.

### Playwright (optional add-on)

- Extend `e2e/product-validation.spec.ts` or admin-metrics spec: admin sees **both** sections on `/admin/metrics`; non-admin sees `admin-page-forbidden`.

### Manual QA

1. Set `ADMIN_EMAIL` in `.env.local` to signed-in email; restart dev server.
2. Open `/admin/metrics` — usage section + product validation section load.
3. Submit feedback at `/feedback`; confirm row appears in product validation table.
4. Sign in as different user — page guard forbids access.
5. (Phase 3) Restart server with Postgres — response still listed.

---

## 12. Risks and Rollback

| Risk | Mitigation |
|------|------------|
| Breaking admin-metrics imports when moving `requireAdminApi` | Re-export from old path during transition |
| Migration renames `tenant_id` on production | Coordinate with DB migration plan; one migration script |
| Dual env vars diverge in Render | Document: set `ADMIN_EMAIL` only |
| Product-validation Postgres half-done | Feature flag via `isPostgresMode()`; memory fallback remains |

**Rollback:** Revert lib gate move (routes keep local checks); schema migration reversible only before production data.

---

## 13. Out of Scope

- Full admin-metrics page (hero, usage table, instrumentation) — see `20260522-1135-admin-metrics-page-dev-plan.md`
- Role-based admin (`users.role === 'admin'`) — future; env email remains v1
- Merging API slugs or admin UIs into one feature folder
- Changing Fork Test fit score formula
- Email notifications on validation submit

---

## 14. Commit Plan

```txt
refactor(lib): add shared requireAdminApi for admin-only routes
refactor(product-validation): use shared admin gate on GET routes
docs: canonical ADMIN_EMAIL for admin metrics and validation
feat(db): align product_validation_responses household_id column
feat(product-validation): add postgres repository adapter (optional phase)
test: admin gate parity across admin-metrics and product-validation APIs
```

---

## 15. Implementation Prompt for Agent

```txt
Implement docs/bug_enhancement/20260522-1430-product-validation-admin-metrics-alignment-plan.md Phase 1 only.

Audit features/lib/server/appAdmin.ts, features/admin-metrics/server/requireAdminApi.ts, and product-validation GET route handlers. Move requireAdminApi to features/lib/server/, update both features to use it, update .env.example and CLAUDE.md for ADMIN_EMAIL. TDD: failing API tests for 403 parity on GET /api/product-validation/summary and GET /api/admin/metrics/summary before refactor.

Do not change /feedback UI, POST validation contract, or admin-metrics table/dashboard. Do not merge feature stores.
```
