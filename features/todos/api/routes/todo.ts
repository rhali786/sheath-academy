import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import { updateTodo, deleteTodo } from '@/features/todos/server/service'
import type { UpdateTodoInput } from '@/features/todos/types'

function notFound(): NextResponse {
  return NextResponse.json(
    { status: 'error', data: null, message: 'To-do not found', timestamp: new Date().toISOString() },
    { status: 404 },
  )
}

export async function PATCH(request: Request, context: { id: string }): Promise<NextResponse> {
  const { id } = context
  const body = await request.json()

  const patch: UpdateTodoInput = {}
  if (body.text !== undefined) patch.text = body.text
  if (body.dueDate !== undefined) patch.dueDate = body.dueDate
  if (body.done !== undefined) patch.done = body.done
  if (body.sortOrder !== undefined) patch.sortOrder = body.sortOrder

  const { householdId } = getRequestAuthCtx()
  const todo = await updateTodo(id, householdId, patch)
  if (!todo) return notFound()

  return NextResponse.json({
    status: 'success',
    data: todo,
    message: 'To-do updated',
    timestamp: new Date().toISOString(),
  })
}

export async function DELETE(_request: Request, context: { id: string }): Promise<NextResponse> {
  const { id } = context
  const { householdId } = getRequestAuthCtx()
  const removed = await deleteTodo(id, householdId)
  if (!removed) return notFound()

  return NextResponse.json({
    status: 'success',
    data: null,
    message: 'To-do deleted',
    timestamp: new Date().toISOString(),
  })
}
