/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/auth/server/routeOwnership', () => ({
  guardOwnership: jest.fn((fn: () => Promise<Response>) => fn()),
  assertSessionOwnership: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/features/todos/server/service', () => ({
  listTodos: jest.fn(),
  createTodo: jest.fn(),
}))

import { listTodos, createTodo } from '@/features/todos/server/service'
import { GET, POST } from '@/features/todos/api/routes/todos'
import type { PersonalTodo } from '@/features/todos/types'

const mockList = listTodos as jest.Mock
const mockCreate = createTodo as jest.Mock

function makeTodo(overrides: Partial<PersonalTodo> = {}): PersonalTodo {
  return {
    id: 'todo_1',
    householdId: 'hh_test',
    text: 'Buy curriculum books',
    done: false,
    dueDate: null,
    sortOrder: 0,
    completedAt: null,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => { mockList.mockReset(); mockCreate.mockReset() })

describe('GET /api/todos', () => {
  it('returns the household todos open-first ordered by sortOrder', async () => {
    mockList.mockResolvedValue([makeTodo({ id: 'todo_1' }), makeTodo({ id: 'todo_2', done: true })])
    const res = await GET(new Request('http://localhost/api/todos'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(2)
    expect(body.data[0].id).toBe('todo_1')
    expect(mockList).toHaveBeenCalledWith('hh_test')
  })

  it('returns an empty list when there are no todos', async () => {
    mockList.mockResolvedValue([])
    const res = await GET(new Request('http://localhost/api/todos'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toEqual([])
  })
})

describe('POST /api/todos', () => {
  it('creates a todo and returns the standard envelope', async () => {
    mockCreate.mockResolvedValue(makeTodo({ id: 'todo_new', text: 'Plan field trip' }))
    const req = new Request('http://localhost/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Plan field trip', dueDate: '2026-07-01' }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.status).toBe('success')
    expect(body.data.id).toBe('todo_new')
    expect(mockCreate).toHaveBeenCalledWith('hh_test', { text: 'Plan field trip', dueDate: '2026-07-01' })
  })

  it('returns 400 when text is missing', async () => {
    const req = new Request('http://localhost/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })
})
