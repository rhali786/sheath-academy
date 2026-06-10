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
  updateTodo: jest.fn(),
  deleteTodo: jest.fn(),
}))

import { updateTodo, deleteTodo } from '@/features/todos/server/service'
import { PATCH, DELETE } from '@/features/todos/api/routes/todo'
import type { PersonalTodo } from '@/features/todos/types'

const mockUpdate = updateTodo as jest.Mock
const mockDelete = deleteTodo as jest.Mock

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

beforeEach(() => { mockUpdate.mockReset(); mockDelete.mockReset() })

describe('PATCH /api/todos/:id', () => {
  it('edits text via the standard envelope', async () => {
    mockUpdate.mockResolvedValue(makeTodo({ text: 'Buy curriculum books and pencils' }))
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Buy curriculum books and pencils' }),
    })
    const res = await PATCH(req, { id: 'todo_1' })
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.text).toBe('Buy curriculum books and pencils')
    expect(mockUpdate).toHaveBeenCalledWith('todo_1', 'hh_test', { text: 'Buy curriculum books and pencils' })
  })

  it('toggles done', async () => {
    mockUpdate.mockResolvedValue(makeTodo({ done: true, completedAt: '2026-06-08T00:00:00.000Z' }))
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: true }),
    })
    const res = await PATCH(req, { id: 'todo_1' })
    const body = await res.json()
    expect(body.data.done).toBe(true)
    expect(body.data.completedAt).toBe('2026-06-08T00:00:00.000Z')
  })

  it('reorders via sortOrder', async () => {
    mockUpdate.mockResolvedValue(makeTodo({ sortOrder: 3 }))
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sortOrder: 3 }),
    })
    const res = await PATCH(req, { id: 'todo_1' })
    const body = await res.json()
    expect(body.data.sortOrder).toBe(3)
  })

  it('returns 404 when not found', async () => {
    mockUpdate.mockResolvedValue(null)
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'x' }),
    })
    const res = await PATCH(req, { id: 'todo_missing' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/todos/:id', () => {
  it('removes the row scoped to the household', async () => {
    mockDelete.mockResolvedValue(true)
    const res = await DELETE(new Request('http://localhost'), { id: 'todo_1' })
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(mockDelete).toHaveBeenCalledWith('todo_1', 'hh_test')
  })

  it('returns 404 when not found', async () => {
    mockDelete.mockResolvedValue(false)
    const res = await DELETE(new Request('http://localhost'), { id: 'todo_missing' })
    expect(res.status).toBe(404)
  })
})
