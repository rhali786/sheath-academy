import { NextResponse } from 'next/server'
import * as todosHandler from './routes/todos'
import * as todoHandler from './routes/todo'

export async function handleTodosRoute(
  slug: string[],
  request: Request
): Promise<NextResponse | null> {
  const method = request.method

  // Handle /todos
  if (slug.length === 0) {
    if (method === 'GET') return todosHandler.GET(request)
    if (method === 'POST') return todosHandler.POST(request)
  }

  // Handle /todos/:id
  if (slug.length === 1) {
    const id = slug[0]
    if (method === 'PATCH') return todoHandler.PATCH(request, { id })
    if (method === 'DELETE') return todoHandler.DELETE(request, { id })
  }

  return null
}
