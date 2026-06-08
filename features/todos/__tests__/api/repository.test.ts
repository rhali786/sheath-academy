/** @jest-environment node */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import {
  listTodoRows,
  getTodoRow,
  insertTodoRow,
  updateTodoRow,
  deleteTodoRow,
} from '../../server/repository'
import { generateTodoId } from '../../server/ids'
import { createTestHousehold } from '@/features/lib/__tests__/fixtures/testDb'

let householdId: string
let cleanup: () => Promise<void>

beforeAll(async () => {
  if (!hasDb) return
  const fixtures = await createTestHousehold('todos')
  householdId = fixtures.household.id
  cleanup = async () => {
    const { getDb } = await import('@/features/lib/server/db')
    const { personalTodos } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    await getDb().delete(personalTodos).where(eq(personalTodos.householdId, householdId))
    await fixtures.cleanup()
  }
})

afterAll(async () => { if (hasDb) await cleanup?.() })

describe('todos repository', () => {
  let todoId: string

  itDb('insertTodoRow inserts a row scoped to the household', async () => {
    todoId = generateTodoId()
    const row = await insertTodoRow(todoId, householdId, { text: 'Buy curriculum books' })
    expect(row.id).toBe(todoId)
    expect(row.householdId).toBe(householdId)
    expect(row.text).toBe('Buy curriculum books')
    expect(row.done).toBe(false)
    expect(row.sortOrder).toBe(0)
  })

  itDb('listTodoRows returns rows for the household', async () => {
    const rows = await listTodoRows(householdId)
    expect(rows.some(r => r.id === todoId)).toBe(true)
  })

  itDb('getTodoRow returns the row scoped to the household', async () => {
    const row = await getTodoRow(todoId, householdId)
    expect(row?.id).toBe(todoId)
  })

  itDb('getTodoRow returns null for a different household', async () => {
    const row = await getTodoRow(todoId, 'hh_other')
    expect(row).toBeNull()
  })

  itDb('updateTodoRow patches fields and updates updatedAt', async () => {
    const before = await getTodoRow(todoId, householdId)
    const row = await updateTodoRow(todoId, householdId, { text: 'Buy curriculum books and pencils', done: true })
    expect(row?.text).toBe('Buy curriculum books and pencils')
    expect(row?.done).toBe(true)
    expect(row?.updatedAt.getTime()).toBeGreaterThanOrEqual(before!.updatedAt.getTime())
  })

  itDb('deleteTodoRow removes the row and reports success', async () => {
    const ok = await deleteTodoRow(todoId, householdId)
    expect(ok).toBe(true)
    const row = await getTodoRow(todoId, householdId)
    expect(row).toBeNull()
  })

  itDb('deleteTodoRow returns false when nothing matches', async () => {
    const ok = await deleteTodoRow('todo_does_not_exist', householdId)
    expect(ok).toBe(false)
  })
})
