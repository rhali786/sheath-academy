import { NextRequest, NextResponse } from 'next/server'
import * as lessonsHandler from './routes/lessons'
import * as lessonHandler from './routes/lesson'

export async function handlePlannerRoute(
  slug: string[],
  request: NextRequest
): Promise<NextResponse | null> {
  const method = request.method

  // GET /lessons — list lessons with optional filters
  if (slug.length === 1 && slug[0] === 'lessons' && method === 'GET') {
    return lessonsHandler.GET(request)
  }

  // POST /lessons — create lesson
  if (slug.length === 1 && slug[0] === 'lessons' && method === 'POST') {
    return lessonsHandler.POST(request)
  }

  // GET /lessons/:id — get single lesson
  if (slug.length === 2 && slug[0] === 'lessons' && method === 'GET') {
    return lessonHandler.GET(slug[1])
  }

  // PUT /lessons/:id — update lesson
  if (slug.length === 2 && slug[0] === 'lessons' && method === 'PUT') {
    return lessonHandler.PUT(slug[1], request)
  }

  // PATCH /lessons/:id/complete — mark lesson as complete
  if (slug.length === 3 && slug[0] === 'lessons' && slug[2] === 'complete' && method === 'PATCH') {
    return lessonHandler.COMPLETE(slug[1])
  }

  return null
}
