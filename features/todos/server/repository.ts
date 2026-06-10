import { and, asc, eq } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { personalTodos } from '@/db/schema'

export type TodoRow = typeof personalTodos.$inferSelect

export interface InsertTodoInput {
  text: string
  dueDate?: string | null
  sortOrder?: number
}

export interface UpdateTodoRowInput {
  text?: string
  dueDate?: string | null
  done?: boolean
  sortOrder?: number
  completedAt?: Date | null
}

export async function listTodoRows(householdId: string): Promise<TodoRow[]> {
  const db = getDb()
  return db
    .select()
    .from(personalTodos)
    .where(eq(personalTodos.householdId, householdId))
    .orderBy(asc(personalTodos.done), asc(personalTodos.sortOrder))
}

export async function getTodoRow(id: string, householdId: string): Promise<TodoRow | null> {
  const db = getDb()
  const result = await db
    .select()
    .from(personalTodos)
    .where(and(eq(personalTodos.id, id), eq(personalTodos.householdId, householdId)))
    .limit(1)
  return result[0] ?? null
}

export async function insertTodoRow(
  id: string,
  householdId: string,
  input: InsertTodoInput,
): Promise<TodoRow> {
  const db = getDb()
  const now = new Date()
  const inserted = await db
    .insert(personalTodos)
    .values({
      id,
      householdId,
      text: input.text,
      done: false,
      dueDate: input.dueDate ?? null,
      sortOrder: input.sortOrder ?? 0,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return inserted[0]
}

export async function updateTodoRow(
  id: string,
  householdId: string,
  input: UpdateTodoRowInput,
): Promise<TodoRow | null> {
  const db = getDb()
  const patch: Partial<TodoRow> = { updatedAt: new Date() }
  if (input.text !== undefined) patch.text = input.text
  if (input.dueDate !== undefined) patch.dueDate = input.dueDate
  if (input.done !== undefined) patch.done = input.done
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder
  if (input.completedAt !== undefined) patch.completedAt = input.completedAt

  const result = await db
    .update(personalTodos)
    .set(patch)
    .where(and(eq(personalTodos.id, id), eq(personalTodos.householdId, householdId)))
    .returning()
  return result[0] ?? null
}

export async function deleteTodoRow(id: string, householdId: string): Promise<boolean> {
  const db = getDb()
  const result = await db
    .delete(personalTodos)
    .where(and(eq(personalTodos.id, id), eq(personalTodos.householdId, householdId)))
    .returning()
  return result.length > 0
}
