import type { PersonalTodo, CreateTodoInput, UpdateTodoInput } from '../types'
import { generateTodoId } from './ids'
import {
  listTodoRows,
  insertTodoRow,
  updateTodoRow,
  deleteTodoRow,
  type TodoRow,
} from './repository'

function toPersonalTodo(row: TodoRow): PersonalTodo {
  return {
    id: row.id,
    householdId: row.householdId,
    text: row.text,
    done: row.done,
    dueDate: row.dueDate,
    sortOrder: row.sortOrder,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listTodos(householdId: string): Promise<PersonalTodo[]> {
  const rows = await listTodoRows(householdId)
  return rows.map(toPersonalTodo)
}

export async function createTodo(
  householdId: string,
  input: CreateTodoInput,
): Promise<PersonalTodo> {
  const row = await insertTodoRow(generateTodoId(), householdId, {
    text: input.text,
    dueDate: input.dueDate ?? null,
  })
  return toPersonalTodo(row)
}

export async function updateTodo(
  id: string,
  householdId: string,
  input: UpdateTodoInput,
): Promise<PersonalTodo | null> {
  const row = await updateTodoRow(id, householdId, {
    text: input.text,
    dueDate: input.dueDate,
    done: input.done,
    sortOrder: input.sortOrder,
  })
  return row ? toPersonalTodo(row) : null
}

export async function toggleTodoDone(
  id: string,
  householdId: string,
  done: boolean,
): Promise<PersonalTodo | null> {
  const row = await updateTodoRow(id, householdId, {
    done,
    completedAt: done ? new Date() : null,
  })
  return row ? toPersonalTodo(row) : null
}

export async function deleteTodo(id: string, householdId: string): Promise<boolean> {
  return deleteTodoRow(id, householdId)
}

export async function reorderTodos(
  householdId: string,
  orderedIds: string[],
): Promise<PersonalTodo[]> {
  for (let i = 0; i < orderedIds.length; i++) {
    await updateTodoRow(orderedIds[i], householdId, { sortOrder: i })
  }
  return listTodos(householdId)
}
