import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import { listTodos, createTodo } from '@/features/todos/server/service'

export async function GET(_request: Request): Promise<NextResponse> {
  const { householdId } = getRequestAuthCtx()
  const todos = await listTodos(householdId)
  return NextResponse.json({
    status: 'success',
    data: todos,
    message: 'Personal to-dos retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json()

  if (typeof body?.text !== 'string' || body.text.trim().length === 0) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'text is required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  const { householdId } = getRequestAuthCtx()
  const todo = await createTodo(householdId, {
    text: body.text,
    ...(body.dueDate !== undefined ? { dueDate: body.dueDate } : {}),
  })
  return NextResponse.json(
    { status: 'success', data: todo, message: 'To-do added', timestamp: new Date().toISOString() },
    { status: 201 },
  )
}
