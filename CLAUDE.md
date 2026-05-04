# Claude Development Guide

## ⚠️ CRITICAL: TDD & Pre-Commit Validation

**Before EVERY commit, you MUST run this exact sequence:**

```bash
# 1. CLEAN INSTALL - Catch transitive dependency issues (peer deps, Rollup resolution)
cd features/dashboard/frontend
rm -rf node_modules package-lock.json
npm install
npm run build  # Must succeed with zero errors

# 2. BACKEND TESTS
cd features/dashboard/backend
pytest test_app.py -v  # Must pass all tests (including startup tests)

# 3. TEST APP STARTUP LOCALLY
cd features/dashboard/backend
timeout 5 uvicorn app.main:app --host 127.0.0.1 --port 8001
# Must show: "Application startup complete" and exit cleanly

# 4. COMMIT ONLY IF ALL PASS
cd /path/to/repo
git add . && git commit -m "..."
```

**Why each step matters:**
- **Clean install**: Transitive peer dependencies (like `prop-types` for Nivo) fail during bundling, not runtime. Cached `node_modules` hides these.
- **Backend tests**: Includes 3 startup tests that catch import errors, dependency issues, and initialization failures
- **App startup**: Catches issues that only manifest when the app actually starts (e.g., missing Rust compilers for native builds on Python 3.14)

**Non-negotiable rule:** Do not commit if build fails, tests fail, or app won't start. Render will catch it and redeploy repeatedly.

## Project Overview

Sheath Academy is a modular homeschool dashboard for the Naeem family (3 students: Adam Gr5, Khadijah Gr3, Zayd Gr8). Built with Python FastAPI backend + React frontend, deployed on Render.

**Current Status**: MVP complete. All 7 dashboard sections functional with mock data and in-memory persistence.

## Architecture

### Data Storage

- **Type**: In-memory (no file I/O — Render has read-only filesystem)
- **Location**: Loaded from Python mock data on startup
- **Persistence**: Session-only (resets on redeploy)
- **Each feature**: Has own backend port and independent API
  - Login feature: port 8000
  - Dashboard feature: port 8001

### Feature Discovery

- **Static Configuration**: Use `shared/config/features.json` to find other features
- **No Runtime Discovery**: Feature locations determined at Claude time via config files
- **Feature Interdependencies**: Defined in each feature's `config.json` under `dependencies`

### Frontend Stack (Dashboard)

- **Build Tool**: Vite (not Next.js) — faster, zero-config, ideal for React SPA
- **State Management**: React Context API (lightweight, sufficient for dashboard scope)
- **Charts**: Nivo (ResponsiveLine for weekly Quran sessions, ResponsiveBar for subject completion)
- **Styling**: Tailwind CSS + system fonts only (no decorative fonts)
- **Type Safety**: TypeScript with strict mode enabled

### Backend Stack (Dashboard)

- **Framework**: FastAPI with Pydantic validation
- **Data Format**: Mock Python objects (no file I/O)
- **Endpoints**: 8 REST endpoints (health, summary, tasks, progress, quran, records, alerts, + POST variants)
- **CORS**: Configured for frontend origin + production wildcard

## Development Setup

### Local Development

**Backend:**
```bash
cd features/dashboard/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

**Frontend:**
```bash
cd features/dashboard/frontend
npm install
npm run dev  # Vite on port 3000
```

### Render Deployment

**Build Command**: `chmod +x build.sh && ./build.sh`
- Compiles React to static files (`dist/`)
- Installs backend dependencies
- Uses `--prefer-binary` and `--no-cache-dir` (read-only filesystem safe)

**Start Command**: `cd features/dashboard/backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Single process serves both API and static React files
- No separate frontend/backend services needed

## Key Conventions

### TypeScript

**Don't:**
- Import React if not directly using `React.createElement()` (JSX alone doesn't need it)
- Import hooks like `useState` if the component doesn't use them
- Use names that conflict with built-in types (`Record` is a TS utility type — use `DashboardRecord`)
- Cast before the OR operator: `(x as T) || fallback` becomes `("undefined") || fallback` (never triggers)
- Use `interface ImportMeta { env: ... }` directly — causes TS2339

**Do:**
- Set `"moduleResolution": "node"` in tsconfig.json (required for JSON imports)
- Cast AFTER the OR operator: `(x || fallback) as T` (allows fallback to work)
- Declare Vite env via `declare module 'vite/client'` in `vite-env.d.ts`
- Keep imports minimal — remove all unused ones (TS6133 warnings)
- Run `npm run build` before pushing to catch type errors

### Nivo Charts

**API Changes Between Versions:**
- Don't use `orient` property on axes (old API)
- Use `axisBottom` and `axisLeft` without `orient`
- Pre-format data on backend, pass directly to Nivo (no transformation on frontend)

### Data Handling

**In-Memory Only:**
- Task completion, Quran logging, etc. persist during session only
- Data resets on app restart/redeploy
- No JSON file writes — Render filesystem is read-only
- Modal data, form state use React useState (not persistent)

## Feature Dependencies

### Dashboard Feature
- Depends on: None (self-contained MVP)
- Will depend on: Login feature (for authentication, when implemented)
- Consumed by: Future features that need homeschool data

### Login Feature
- Depends on: None
- Provides: User authentication (not yet integrated with dashboard)

## Learned Lessons & Future Risks

### What Went Wrong (Fixed)

1. **TypeScript Defaults**
   - `moduleResolution` defaults to "classic" (doesn't support JSON imports)
   - Solution: Explicitly set to "node"

2. **Name Collisions**
   - Naming a custom interface `Record` conflicts with TS built-in `Record<K,V>` type
   - Solution: Renamed to `DashboardRecord`

3. **Vite Environment Variables**
   - `import.meta.env` not typed by default → TS2339 error
   - Solution: Create `vite-env.d.ts` with type definitions

4. **Nivo API**
   - Axis configuration changed between versions (removed `orient` property)
   - Solution: Check Nivo docs for current API, avoid old examples

5. **Render Filesystem**
   - Read-only filesystem prevents file I/O and cache writes
   - Solution: Use in-memory data, disable pip/npm caches via environment variables

### What Could Break (Not Yet Implemented)

**Validation & Error Handling:**
- No form validation on Quran logging modal (orphaned data possible)
- No error boundaries on components (single error crashes entire app)
- Minimal API error handling (connection failures not gracefully handled)
- No timeout handling for slow backends

**User Experience:**
- No skeleton loading states (only generic spinner)
- No pagination (large datasets will render all at once)
- No search/filter functionality
- No dark mode (Tailwind configured but not wired)
- No accessibility improvements (forms lack proper labels, focus management missing)
- Mobile breakpoints not fully tested

**Data & Persistence:**
- In-memory only — data loss on redeploy expected and acceptable
- No export functionality actually works (mock endpoints only)
- No real database integration
- No backup/recovery mechanism

**Testing:**
- Zero unit tests
- Zero integration tests
- Manual QA only

**Scaling:**
- Single FastAPI process (no load balancing)
- No caching layer (Nivo charts recalculated on every request)
- No database query optimization (irrelevant now, but needed for real data)

## Next Steps (Priority Order)

1. **Integrate Login Feature** — Add authentication, protect dashboard routes
2. **Add Form Validation** — Prevent orphaned Quran sessions, invalid task data
3. **Error Boundaries** — Catch component crashes, show fallback UI
4. **Real Data Persistence** — Migrate from in-memory to database (if feature survives MVP)
5. **Tests** — Unit tests for hooks, integration tests for API calls
6. **Accessibility** — ARIA labels, keyboard navigation, focus management
7. **Dark Mode** — Wire up Tailwind dark: variant
8. **Advanced Filtering** — Search, date range, student filtering on records

## File Structure Reference

```
features/dashboard/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, routes
│   │   ├── models.py         # Pydantic models
│   │   ├── crud.py           # In-memory data store
│   │   └── routes/
│   │       ├── tasks.py
│   │       ├── progress.py
│   │       ├── quran.py
│   │       └── records.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Dashboard.tsx      # Main page orchestrator
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── TodayState.tsx
│   │   │   ├── DoToday.tsx
│   │   │   ├── NeedsAttention.tsx
│   │   │   ├── PerChildProgress.tsx
│   │   │   ├── QuranStudies.tsx
│   │   │   ├── RecordsProof.tsx
│   │   │   └── shared/
│   │   │       ├── MetricCard.tsx
│   │   │       ├── TaskCheckbox.tsx
│   │   │       ├── AlertItem.tsx
│   │   │       └── ChartContainer.tsx
│   │   ├── services/
│   │   │   └── api.ts              # Axios client
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript interfaces
│   │   ├── styles/
│   │   │   └── globals.css         # Tailwind + custom CSS
│   │   ├── App.tsx                 # Context provider
│   │   └── main.tsx                # Vite entry
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── vite-env.d.ts              # Vite env types
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── index.html
├── data/
│   └── (no files — in-memory storage)
└── config.json                     # Feature version & dependencies
```

## Color Scheme (Functional Only)

- **Green (#10b981)**: Ready, on track, complete ✓
- **Amber (#f59e0b)**: Needs attention, warning ⚠
- **Red (#ef4444)**: Overdue, error ✗
- **Blue (#3b82f6)**: Primary actions, tabs, info
- **Gray**: Secondary, disabled, neutral

## Test-Driven Development (TDD) Workflow

**For every feature or fix:**

1. **Write the test first** (before code)
   - Define what success looks like
   - Test should fail initially (red)

2. **Write minimal code to pass** (green)
   - Only code needed to make test pass
   - No extra features or cleanup yet

3. **Refactor & improve** (refactor)
   - Clean up code
   - Remove duplication
   - Keep tests passing

4. **Run full test suite** (validation)
   ```bash
   pytest test_app.py -v
   npm run build
   ```

5. **Commit only if tests pass**
   - All tests green
   - Build succeeds
   - No TypeScript errors

**Example: Adding a new endpoint**
```python
# Step 1: Write test in test_app.py
def test_new_endpoint_returns_correct_data():
    response = client.get("/api/new-endpoint")
    assert response.status_code == 200
    assert "expected_field" in response.json()["data"]

# Step 2: Implement minimal endpoint in main.py
@app.get("/api/new-endpoint")
def new_endpoint():
    return {"status": "success", "data": {"expected_field": "value"}}

# Step 3: Run tests (must pass)
pytest test_app.py::test_new_endpoint_returns_correct_data

# Step 4: Full validation
pytest test_app.py -v && npm run build

# Step 5: Commit
git commit -m "feat: Add new endpoint with test coverage"
```

## Testing & Verification

### Run All Tests (REQUIRED)

**Backend Tests (Python):**
```bash
cd features/dashboard/backend
pip install -r requirements.txt
pytest test_app.py -v
```
- **24 tests** covering: endpoints, data shapes, integrity, persistence
- Runs in ~0.5s
- Must pass before pushing

**Frontend Build (TypeScript):**
```bash
cd features/dashboard/frontend
npm install
npm run build  # Must pass with zero errors before pushing
```
- Catches TypeScript errors locally (not on Render)
- Zero errors required

**Summary**: Always run both before git push:
```bash
# Test backend
cd features/dashboard/backend && pytest test_app.py

# Build frontend
cd features/dashboard/frontend && npm run build
```

### Predictable Error Patterns (Prevent These)

| Error | Pattern | Fix |
|-------|---------|-----|
| `Record requires 2 type args` | `useState<Record[]>` | Use `DashboardRecord[]` (avoid built-in type names) |
| `'env' does not exist` | Missing tsconfig include | Add `vite-env.d.ts` to tsconfig.json `include` |
| Unused React import | `import React from 'react'` without `React.` calls | Remove it (JSX Transform doesn't need it) |
| Unused hook import | `import { useState } from 'react'` if not used | Remove unused imports (TS6133) |
| Cast blocks fallback | `(x as T) \|\| fallback` | Move cast: `(x \|\| fallback) as T` |

### Common Errors & How to Avoid
- **Always run `npm run build` before pushing** — catches 90% of issues
- **Check tsconfig.json include** — files outside `include` aren't type-checked
- **Avoid names that match TS built-ins** — Record, Partial, Pick, etc.
- **Remove all unused imports** — TypeScript strict mode flags them (TS6133)

### On Render
- Check `/api/health` endpoint (should return 200)
- Verify build logs for cache/permission errors
- Open app URL, inspect network tab for API calls
- Check browser console for errors

## Common Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| TS2339: `'env' does not exist` | Vite env types missing | Create `vite-env.d.ts` |
| TS2315: `Type 'Record' not generic` | Name collision | Rename to `DashboardRecord` |
| TS6133: Unused imports | Modern React doesn't need import | Remove `import React` |
| Nivo axis `orient` error | Old API | Remove `orient`, use axes directly |
| Render build fails on cache | Read-only filesystem | Use `--no-cache-dir`, `TMPDIR=/tmp` |
| CORS errors in browser | Missing origin | Add frontend origin to FastAPI CORS |
| Commit pushed with broken tests | Skipped pre-commit validation | **ALWAYS run tests first** |
| Render build fails after push | Error not caught locally | **Run `pytest` + `npm run build` before commit** |

## Pre-Commit Checklist

**BEFORE EVERY `git commit` (IN THIS EXACT ORDER):**

1. **Fresh Build (catch transitive dependency issues)**
   - [ ] `rm -rf features/dashboard/frontend/node_modules package-lock.json`
   - [ ] `cd features/dashboard/frontend && npm install`
   - [ ] `npm run build` passes (zero TypeScript errors, zero bundling errors)

2. **Backend Tests**
   - [ ] Tests written (TDD: red → green → refactor)
   - [ ] `cd features/dashboard/backend && pytest test_app.py -v` passes (all tests green, including startup tests)

3. **App Startup Test**
   - [ ] `timeout 5 uvicorn app.main:app --host 127.0.0.1 --port 8001` starts successfully
   - [ ] See "Application startup complete" in output
   - [ ] App exits cleanly when timeout fires

4. **Code Quality**
   - [ ] No unused imports (TypeScript TS6133 warnings)
   - [ ] No TypeScript errors in build output
   - [ ] No broken tests in commit

5. **Final Step**
   - [ ] `git add . && git commit -m "..."` only if all above pass

**DO NOT commit if:**
- ❌ Any tests fail
- ❌ Any TypeScript errors in build
- ❌ Build fails (bundler errors, rollup errors)
- ❌ App fails to start (import errors, missing dependencies)
- ❌ Unused imports remain
- ❌ Fresh install reveals new issues

**Why this order matters:**
- Clean install catches peer dependencies missed by cached node_modules (e.g., prop-types, maturin failures)
- Tests verify API endpoints work and startup succeeds
- App startup test catches runtime dependency issues (e.g., Python 3.14 + pydantic-core source builds)
- TypeScript errors caught early
- Only then is it safe to push

This prevents: local error → push → Render fails → redeploy cycle


