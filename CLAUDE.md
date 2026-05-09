# Claude Development Guide

## ⚠️ CRITICAL: TDD & Pre-Commit Validation

**Git hooks are ACTIVE:**
- ✅ **Pre-commit hook** (`.git/hooks/pre-commit`): Validates build, tests, and server before allowing commit
- ✅ **Post-commit hook** (`.git/hooks/post-commit`): Automatically triggers Render deployment after successful commit

### Automatic Pre-Commit Validation

The `.git/hooks/pre-commit` hook enforces all 4 steps below automatically. If ANY step fails, the commit is rejected.

### Manual Verification (if needed)

**Before EVERY commit, you MUST run this exact sequence:**

```bash
# 1. CLEAN INSTALL - Catch transitive dependency issues
rm -rf node_modules package-lock.json
npm install

# 2. BUILD FRONTEND & BACKEND (Next.js handles both)
npm run build  # Must succeed with zero TypeScript errors

# 3. RUN TESTS
npm test  # Must pass all 33 Jest tests

# 4. TEST APP LOCALLY
npm run dev &
sleep 3
curl http://localhost:3000/api/health  # Must return 200 with status: "healthy"
pkill -f "next dev"

# 5. COMMIT ONLY IF ALL PASS
git add . && git commit -m "..."
```

**Why each step matters:**
- **Clean install**: Transitive peer dependencies fail during bundling, not runtime
- **Build**: Catches TypeScript errors before they reach production
- **Tests**: 33 Jest tests verify all API endpoints, CRUD operations, data integrity, and UI component integration
- **App startup**: Verifies Next.js server starts cleanly and endpoints respond

**Non-negotiable rule:** Do not commit if build fails, tests fail, or app won't start.

## Project Overview

Sheath Academy is a modular homeschool dashboard for the Naeem family (3 students: Adam Gr5, Khadijah Gr3, Zayd Gr8). Built with **Next.js unified stack** (no separate backend/frontend), deployed on Render.

**Current Status**: MVP complete. All 7 dashboard sections functional with mock data and in-memory persistence. Migrated from Python FastAPI + React Vite to Node.js Next.js (unified JavaScript stack).

**Why the migration:** Python dependency management issues (pydantic-core native extensions fail on different Python versions, no wheels for Python 3.14) eliminated by using JavaScript which has universal wheel availability.

## Architecture

### Data Storage

- **Type**: In-memory (no file I/O — Render has read-only filesystem)
- **Location**: Loaded from TypeScript mock data on server startup (features/lib/server/mockData.ts)
- **Persistence**: Session-only (resets on redeploy); persists across requests in same process
- **Single process**: Next.js handles API routes + React frontend rendering

### Backend Stack (Next.js API Routes)

- **Framework**: Next.js 15 with App Router
- **Routing**: 
  - `/app/api/health/route.ts` - Global health check (standalone)
  - `/app/api/[...slug]/route.ts` - Dynamic router for all dashboard endpoints
- **Business Logic**: `/features/dashboard/api/routes/` (handler implementations)
- **Route Mapper**: `/features/dashboard/api/router.ts` (maps slugs to handlers)
- **8 REST Endpoints**:
  - GET `/api/health` - Health check
  - GET `/api/dashboard/summary` - Summary metrics
  - GET/POST `/api/dashboard/tasks` - Task list and completion
  - GET `/api/dashboard/progress` - Child progress data
  - GET/POST `/api/dashboard/quran` - Quran sessions + chart data
  - GET `/api/dashboard/records` - Records (attendance, portfolio, etc.)
  - GET `/api/dashboard/alerts` - Alerts
- **Data Store**: TypeScript in-memory store (features/lib/server/dataStore.ts)
- **Type Safety**: Full TypeScript with strict mode

### Frontend Stack

- **Framework**: React 18.3 (kept from original implementation)
- **Location**: `/features/dashboard/front/` (components, pages, services, context)
- **Routing**: `/app/page.tsx` imports Dashboard and wraps it in DashboardProvider
- **State Management**: React Context API (DashboardProvider in `/features/dashboard/front/context/DashboardProvider.tsx`)
- **Charts**: Nivo 0.83.0 (ResponsiveLine for weekly Quran sessions, ResponsiveBar for subject completion)
- **Styling**: Tailwind CSS + system fonts only (no decorative fonts)
- **API Client**: Axios (features/dashboard/front/services/api.ts) pointing to `/api/*` routes

## Development Setup

### Local Development

```bash
# Install dependencies (single package.json at root)
npm install

# Start dev server (API + React on port 3000)
npm run dev

# Run tests (all 27 must pass)
npm test

# Build for production
npm run build

# Start production server
npm run start
```

### Render Deployment

**Build Command**: `npm run build`
- Next.js compiles API routes and React frontend
- Single build process, no separate steps

**Start Command**: `npm run start`
- Next.js starts single process serving:
  - API routes on `/api/*`
  - React frontend on `/`

## File Structure (Non-Standard but Intentional)

```
/features/                             # Modular feature structure
  /lib/                                # Shared across all features
    /types.ts                          # TypeScript interfaces
    /server/
      /mockData.ts                     # Mock data (exact copy from Python)
      /dataStore.ts                    # In-memory store (replaces Python CRUD)
  /dashboard/                          # Self-contained feature
    /__tests__/                        # Feature-specific tests (27 tests)
    /api/
      /routes/                         # Handler implementations
        /summary.ts
        /tasks.ts
        /tasks-complete.ts
        /progress.ts
        /quran.ts
        /records.ts
        /alerts.ts
      /router.ts                       # Dynamic route mapper
    /front/                            # React components
      /context/                        # State management
        /DashboardProvider.tsx         # Dashboard context + hooks
      /components/                     # Reusable UI components
      /pages/Dashboard.tsx             # Main dashboard page
      /services/api.ts                 # Axios API client
      /styles/globals.css              # CSS
  /login/                              # Future feature (same structure)

/app/                                  # Next.js app (framing only)
  /api/
    /health/route.ts                   # Global health check (standalone)
    /[...slug]/route.ts                # Dynamic router → delegates to /features/dashboard/api/router
  /layout.tsx                          # Root layout (Server Component)
  /page.tsx                            # Home page (wraps Dashboard in DashboardProvider)
  /globals.css                         # Tailwind imports

/package.json                          # Single at root (all dependencies)
/tsconfig.json                         # TypeScript config (excludes abandoned dirs)
/jest.config.js
/render.yaml
/CLAUDE.md
```

### Why This Structure?

**Standard Next.js** puts everything in `/app/`, which gets messy with multiple features:
```
/app/                  ← Becomes bloated
  /api/health
  /api/dashboard/...
  /api/login/...
  /components/health
  /components/dashboard
  /components/login
  /...
```

**Our Structure** separates features cleanly:
```
/features/dashboard/   ← Self-contained, could move to separate monorepo
/features/login/
/features/...

/app/                  ← Just the Next.js routing layer (thin)
```

**Benefits:**
- Easy to add new features (copy /features/dashboard/ structure)
- Clear separation: API logic in `/features/*/back/`, UI in `/features/*/front/`
- Single package.json makes dependencies explicit
- Tests live with the feature (`/features/dashboard/__tests__/`)
- Could eventually split into separate repositories

## Key Conventions

### TypeScript

**Don't:**
- Import React if not directly using `React.createElement()` (JSX alone doesn't need it in Next.js)
- Import hooks like `useState` if the component doesn't use them
- Use names that conflict with built-in types (`Record` is a TS utility type — use `DashboardRecord`)
- Cast before the OR operator: `(x as T) || fallback` becomes `("undefined") || fallback` (never triggers)

**Do:**
- Keep `"moduleResolution": "bundler"` in tsconfig.json (Next.js default)
- Cast AFTER the OR operator: `(x || fallback) as T` (allows fallback to work)
- Mark client components with `'use client'` directive at top of file
- Keep imports minimal — remove all unused ones (TS6133 warnings)
- Run `npm run build` before pushing to catch type errors
- Import from `/features/*/` in `/app/api/` routes to keep them thin

### API Routes (Dynamic Routing Pattern)

API routes in `/app/api/` are kept thin and delegate to `/features/`:

**Global endpoints** stay in `/app/api/`:
```typescript
// /app/api/health/route.ts (standalone, simple response)
export async function GET() {
  return NextResponse.json({ status: 'healthy', ... })
}
```

**Feature endpoints** use dynamic routing:
```typescript
// /app/api/[...slug]/route.ts (catches /api/dashboard/*)
export async function GET(request, { params }) {
  const { slug } = await params
  if (slug[0] === 'dashboard') {
    return handleDashboardRoute(slug.slice(1), request)
  }
  // 404
}

// /features/dashboard/api/router.ts (maps routes to handlers)
export async function handleDashboardRoute(slug, request) {
  // slug = ['summary'], ['tasks'], ['tasks', 'id123', 'complete'], etc.
  // Maps to correct handler in /features/dashboard/api/routes/
}
```

**Why dynamic routing?**
- `/app/` stays thin (2 files: health.ts and [..slug].ts)
- All feature logic lives in `/features/dashboard/api/routes/`
- Easy to add new features (just add handler to routes/)
- Clean separation: routing in /app, logic in /features

### API Response Format (All Endpoints)

Every endpoint returns this exact structure:
```typescript
{
  status: "success",
  data: T,
  message: string,
  timestamp: ISO8601 string
}
```

Error responses use same format with status: "error" and 4xx/5xx HTTP code.

### Data Handling

**In-Memory Only:**
- Task completion, Quran logging, etc. persist during session only
- Data resets on app restart/redeploy
- Modal data, form state use React useState (not persistent)
- All updates modify the in-memory store in features/lib/server/dataStore.ts

## Testing

### Run All Tests
```bash
npm test
```

**Coverage:** 27 Jest tests covering:
- API endpoints (health, summary, tasks, progress, quran, records, alerts)
- CRUD operations (data store, persistence)
- Data integrity (no duplicate IDs, valid child references)
- Error handling (invalid task IDs, missing data)

Tests live in `/features/dashboard/__tests__/api/` (co-located with the feature).

All tests must pass before committing.

## TDD for UI Components (Critical)

**MANDATORY: Every UI component must have an integration test BEFORE any component code is written.**

### Why This Matters

A "useDashboard must be used within DashboardProvider" error was not caught until it crashed on Render because no integration tests existed. The component tests only tested isolated functions, not the actual component tree with providers.

### The Problem That Was Caught by TDD

- **Old approach**: Test individual functions → Test fails? → Fix code → Deploy
- **Real world**: Component tree broken → Works locally (luck, import order) → Crashes on Render
- **TDD approach**: Write integration test first → Test catches context/provider errors IMMEDIATELY

### Test Architecture

**UI Tests Location**: `/features/dashboard/__tests__/integration/`

```
__tests__/
├── fixtures/
│   └── mockData.ts              # Realistic mock data for all tests
├── utils/
│   └── renderWithProvider.tsx   # Custom render() that wraps with DashboardProvider
├── integration/
│   ├── Dashboard.test.tsx       # Full page integration (catches context errors)
│   └── components/
│       ├── TodayState.test.tsx  # Simple presentational component
│       └── DashboardComponents.test.tsx  # Multi-component integration tests
└── mocks/
    └── nivo.tsx                 # Mocked Nivo chart components (avoid ES6 module issues)
```

### Custom Render Function (renderWithProvider)

All component tests use this render function to automatically wrap components in DashboardProvider:

```typescript
// Import this custom render, NOT from @testing-library/react directly
import { render, screen } from '@testing-library/react/__tests__/utils/renderWithProvider'

// Now Dashboard's useContext_Dashboard() hook will work correctly
test('Dashboard renders within provider', () => {
  render(<Dashboard />)  // DashboardProvider is automatic
  expect(screen.getByText(/Today/i)).toBeInTheDocument()
})
```

### Test Requirements for New Components

Before writing any React component, write tests that verify:

1. **Component renders without crashing** — If it uses a hook, test with provider
2. **Props are handled correctly** — Empty state, null values, data present
3. **Child components render** — Hooks don't throw context errors
4. **User interactions work** — Click handlers, form inputs, state changes

### Running Tests

```bash
# Run all 33 tests (UI + API)
npm test

# Run only UI integration tests
npm test -- integration

# Run specific component test
npm test -- DashboardComponents.test.tsx

# Watch mode (re-run on file change)
npm test -- --watch
```

### Why jsdom Environment

Tests run with `testEnvironment: 'jsdom'` (not 'node') because:
- jsdom simulates a real browser DOM
- React Testing Library can query elements like `screen.getByText()`
- Can test component rendering, event handling, hooks
- Catches context provider errors (the original problem)

### Nivo Charts in Tests

Nivo components are mocked to avoid ES6 module parsing errors in Jest:

```typescript
// jest.config.js
moduleNameMapper: {
  '^@nivo/line$': '<rootDir>/features/dashboard/__tests__/mocks/nivo.tsx',
  '^@nivo/bar$': '<rootDir>/features/dashboard/__tests__/mocks/nivo.tsx',
}

// Mocks render <div data-testid="mocked-line-chart">
// Tests can verify chart is rendering without DOM errors
```

## Migration Notes (from FastAPI to Next.js)

**What changed:**
- Backend: Python FastAPI → Next.js API routes
- Dependency management: pip + npm → npm only
- Build process: build.sh (complex) → `npm run build` (single command)
- Runtime: Python 3.12 → Node.js 22.22.2
- Type validation: Pydantic models → TypeScript interfaces
- Tests: pytest (Python) → Jest (JavaScript)
- **Project structure**: /features/ as the source of truth, /app/ as thin routing layer

**What stayed the same:**
- React frontend code (no changes needed)
- API response shapes (identical)
- Mock data structure (exact copy)
- In-memory data persistence
- All 7 dashboard sections
- Tailwind CSS styling
- Nivo charts

## Learned Lessons & Future Risks

### Why Next.js Over FastAPI

**Problem with Python:**
- Python 3.14 (newly released) lacks wheels for pydantic-core native extension
- Source builds fail on Render's read-only filesystem
- Version mismatches between Python versions require different builds

**Solution with JavaScript:**
- Node.js prebuilds available for all versions
- No native extensions (JavaScript is interpreted)
- Single `npm install` works everywhere
- Same npm ecosystem as existing frontend

### Why /features/ Over /app/

**Monolithic /app/ problem:**
- Single feature directory gets bloated with multiple features
- Hard to separate concerns (API, UI, types, tests)
- Difficult to move features to separate monorepo later

**/features/ solution:**
- Each feature self-contained (dashboard, login, etc.)
- Clear structure: `back/`, `front/`, `__tests__/`, `lib/`
- `/app/` stays thin (just routing, imports from /features/)
- Easy to add new features (copy /features/dashboard/)

### What Could Break

**Validation & Error Handling:**
- No form validation on Quran logging modal (orphaned data possible)
- No error boundaries on components (single error crashes entire app)
- Minimal API error handling (connection failures not gracefully handled)

**User Experience:**
- No skeleton loading states (generic spinner only)
- No pagination (large datasets render all at once)
- No search/filter functionality
- Mobile breakpoints not fully tested

**Data & Persistence:**
- In-memory only — data loss on redeploy expected
- No export functionality actually works (mock endpoints)
- No real database integration
- No backup/recovery

**Testing:**
- All tests are unit/integration (Jest) - no e2e browser tests
- No load testing
- Manual QA during development required

### Next Steps (Priority Order)

1. **Verify Render deployment works** — Test all endpoints on production
2. **Integrate Login feature** — Add authentication, protect dashboard routes
3. **Add form validation** — Prevent orphaned Quran sessions
4. **Error boundaries** — Catch component crashes
5. **Real data persistence** — Migrate from in-memory to database
6. **Tests** — Add e2e tests with Playwright
7. **Performance** — Add caching, optimize Nivo charts
8. **Accessibility** — ARIA labels, keyboard navigation
9. **Dark mode** — Wire up Tailwind dark: variant
10. **Advanced filtering** — Search, date range, student filtering

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Build fails | Unused imports | Remove all `TS6133` warnings |
| `npm install` hangs | Network issue | `npm cache clean --force` and retry |
| Tests fail | Import path mismatch | Check imports use `/features/lib/` and `/features/dashboard/front/` |
| Localhost:3000 won't connect | Port in use | `pkill -f "next dev"` then retry |
| TypeScript errors | Type mismatch | Check `features/lib/types.ts` matches actual API responses |
| Nivo charts not rendering | Missing data | Verify chart data is pre-formatted (x, y points) on backend |

## Common Errors & How to Avoid

- **Always run `npm run build` before pushing** — catches 99% of issues
- **Run `npm test` before committing** — all 33 tests must pass
- **Check `npm run dev` starts cleanly** — catches runtime dependency issues
- **Never commit with unused imports** — `TS6133` warnings must be resolved
- **Verify API endpoints with curl** — confirm response shape before assuming it works
- **Keep /app/api/ routes thin** — delegate to /features/dashboard/back/ for logic
- **Import from /features/ consistently** — avoid circular imports by keeping /app/ as thin routing layer

## Critical Error to Watch For: Context Provider Mismatch

### The Error
```
Error: useDashboard must be used within DashboardProvider
```

### Why It Happens
- Component imports hook from wrong module (e.g., importing from `App.tsx` instead of `context/DashboardProvider.tsx`)
- Multiple context instances exist in codebase (one in App.tsx, one in DashboardProvider.tsx)
- Hook is used in component but provider instance is different

### How to Prevent It
1. **Use custom render function in tests**: Always render components within their providers
   ```typescript
   import { render } from '@testing-library/react/__tests__/utils/renderWithProvider'
   // Automatically wraps component in DashboardProvider
   ```

2. **Check import paths**: When using `useContext_Dashboard()`, verify it's imported from:
   ```typescript
   // ✓ CORRECT
   import { useContext_Dashboard } from '../context'
   
   // ✗ WRONG
   import { useContext_Dashboard } from '../App'
   ```

3. **Run integration tests before committing**: Tests catch this error immediately
   ```bash
   npm test -- integration  # Runs all UI component tests
   ```

4. **When adding new components**: 
   - Write integration test FIRST (renders component within DashboardProvider)
   - Test will fail if component uses wrong hook instance
   - Fix import paths until test passes
   - Only then add component code

### Why Tests Are Essential
- **'node' environment**: Can't render components with providers → errors slip through
- **'jsdom' environment**: Simulates browser DOM → component tree errors caught immediately
- **Example**: "useDashboard must be used within DashboardProvider" error NOT caught in 'node' but IS caught in 'jsdom' tests
