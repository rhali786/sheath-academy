import { NextResponse } from 'next/server'
import * as lessonTasksHandler from './routes/lesson-tasks'
import * as lessonTaskHandler from './routes/lesson-task'

export async function handleLessonTasksRoute(
  slug: string[],
  request: Request
): Promise<NextResponse | null> {
  const method = request.method

  // GET /lesson-tasks — list
  if (slug.length === 0 && method === 'GET') {
    return lessonTasksHandler.GET(request)
  }

  // POST /lesson-tasks — create
  if (slug.length === 0 && method === 'POST') {
    return lessonTasksHandler.POST(request)
  }

  // GET /lesson-tasks/:id — get one
  if (slug.length === 1 && method === 'GET') {
    return lessonTaskHandler.GET(slug[0])
  }

  // PATCH /lesson-tasks/:id — update
  if (slug.length === 1 && method === 'PATCH') {
    return lessonTaskHandler.PATCH(slug[0], request)
  }

  // DELETE /lesson-tasks/:id — delete
  if (slug.length === 1 && method === 'DELETE') {
    return lessonTaskHandler.DELETE(slug[0])
  }

  return null
}
