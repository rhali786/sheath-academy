# Testing patterns

Concrete boilerplate for the three test types used in this codebase. For rules (when to write each type, TDD requirements) see `CLAUDE.md`.

---

## 1. API route handler test

Environment: `node`. Mock auth + repository boundary. Never mock `getDb()`.

```ts
/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/auth/server/routeOwnership', () => ({
  guardOwnership: jest.fn((fn: () => Promise<Response>) => fn()),
  assertSessionOwnership: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/features/<feature>/server/repository', () => ({
  listThings: jest.fn(),
  createThing: jest.fn(),
}))

import { listThings, createThing } from '@/features/<feature>/server/repository'
import { GET, POST } from '@/features/<feature>/api/routes/<handler>'

const mockList = listThings as jest.Mock
const mockCreate = createThing as jest.Mock

beforeEach(() => { mockList.mockReset(); mockCreate.mockReset() })

describe('GET /api/<feature>/things', () => {
  it('returns empty array when no data', async () => {
    mockList.mockResolvedValue([])
    const res = await GET(new Request('http://localhost/api/<feature>/things'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toEqual([])
  })

  it('returns 400 for invalid input', async () => {
    const res = await GET(new Request('http://localhost/api/<feature>/things?bad=param'))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/<feature>/things', () => {
  it('returns 400 when required fields missing', async () => {
    const req = new Request('http://localhost/api/<feature>/things', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

---

## 2. Repository test (Postgres integration)

Environment: `node`. Skips when `DATABASE_URL` is not set. Always cleans up after itself.

```ts
/** @jest-environment node */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import { createThingRow, listThingRows } from '../../server/repository'
import { createTestHousehold } from '@/features/lib/__tests__/fixtures/testDb'

let householdId: string
let cleanup: () => Promise<void>

beforeAll(async () => {
  if (!hasDb) return
  const fixtures = await createTestHousehold('<feature>')
  householdId = fixtures.household.id
  cleanup = async () => {
    const { getDb } = await import('@/features/lib/server/db')
    const { things } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    await getDb().delete(things).where(eq(things.householdId, householdId))
    await fixtures.cleanup()
  }
})

afterAll(async () => { if (hasDb) await cleanup?.() })

describe('<feature> repository', () => {
  let thingId: string

  itDb('createThingRow inserts a row', async () => {
    const row = await createThingRow(householdId, { title: 'Test' })
    thingId = row.id
    expect(row.id).toBeTruthy()
    expect(row.householdId).toBe(householdId)
  })

  itDb('listThingRows returns rows for household', async () => {
    const rows = await listThingRows(householdId)
    expect(rows.some(r => r.id === thingId)).toBe(true)
  })
})
```

---

## 3. Integration test — component with context

Environment: `jsdom` (default). Mock every context the component consumes. Use `mockImplementation` not `mockReturnValueOnce` — components re-render multiple times in Strict Mode.

```tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MyComponent } from '@/features/<feature>/front/components/MyComponent'

// Mock each context the component uses
jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))
jest.mock('@/features/<feature>/front/context', () => ({
  use<Feature>: jest.fn(),
}))

import { useHousehold } from '@/features/household/front/context'
import { use<Feature> } from '@/features/<feature>/front/context'

const mockUseHousehold = useHousehold as jest.Mock
const mockUse<Feature> = use<Feature> as jest.Mock

const defaultHousehold = () => ({
  familyName: 'Test Family',
  householdProfile: null,
  needsSetup: false,
  loading: false,
  error: null,
  refetch: jest.fn(),
})

const defaultFeature = () => ({
  items: [],
  loading: false,
  error: null,
})

// Reset to defaults after every test
afterEach(() => {
  mockUseHousehold.mockImplementation(defaultHousehold)
  mockUse<Feature>.mockImplementation(defaultFeature)
})

beforeEach(() => {
  mockUseHousehold.mockImplementation(defaultHousehold)
  mockUse<Feature>.mockImplementation(defaultFeature)
})

describe('MyComponent', () => {
  it('renders loading state', () => {
    mockUse<Feature>.mockImplementation(() => ({ ...defaultFeature(), loading: true }))
    render(<MyComponent />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders empty state', () => {
    render(<MyComponent />)
    expect(screen.getByText(/no items/i)).toBeInTheDocument()
  })

  it('renders populated state', () => {
    mockUse<Feature>.mockImplementation(() => ({
      ...defaultFeature(),
      items: [{ id: '1', title: 'Thing' }],
    }))
    render(<MyComponent />)
    expect(screen.getByText('Thing')).toBeInTheDocument()
  })

  it('calls handler on button click', () => {
    const onPress = jest.fn()
    render(<MyComponent onPress={onPress} />)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(onPress).toHaveBeenCalled()
  })
})
```

---

## 4. Simple component test (no context)

Use when the component takes plain props and has no hooks. No mocking needed.

```tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import { MyCard } from '@/features/<feature>/front/components/MyCard'
import type { Thing } from '@/features/<feature>/types'

const makeThing = (overrides: Partial<Thing> = {}): Thing => ({
  id: 'thing_001',
  title: 'Test Thing',
  status: 'active',
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('MyCard', () => {
  it('renders the title', () => {
    render(<MyCard thing={makeThing()} />)
    expect(screen.getByText('Test Thing')).toBeInTheDocument()
  })

  it('shows inactive badge for inactive status', () => {
    render(<MyCard thing={makeThing({ status: 'inactive' })} />)
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })
})
```

---

## Key rules

- **`mockImplementation` not `mockReturnValueOnce`** — components render more than once (Strict Mode). `mockReturnValueOnce` runs dry and returns `undefined` on re-renders.
- **Reset in `afterEach`** — prevents state leaking between tests.
- **Mock at the repository boundary** — never mock `getDb()` directly.
- **`renderWithProvider`** — for components inside `DashboardProvider`, use `@/features/dashboard/__tests__/utils/renderWithProvider` instead of bare `render`.
- **Nivo** — `@nivo/line`, `@nivo/bar`, `@nivo/core` are auto-mocked via `__tests__/mocks/nivo.tsx`. Do not import them directly in tests.
- **next-auth/react** — auto-mocked via `__mocks__/next-auth/react.ts` (unauthenticated by default). Override per-test with `jest.mock(...)`.
