import { NextResponse } from 'next/server'
import * as lessonsHandler from './routes/lessons'
import * as lessonHandler from './routes/lesson'
import * as lessonStepsHandler from './routes/lesson-steps'
import * as progressHandler from './routes/progress'
import * as historyHandler from './routes/history'

export async function handlePlanRoute(
  slug: string[],
  request: Request
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

  // PATCH /lessons/:id/complete — mark lesson as complete or skipped
  if (slug.length === 3 && slug[0] === 'lessons' && slug[2] === 'complete' && method === 'PATCH') {
    return lessonHandler.COMPLETE(slug[1], request)
  }

  // DELETE /lessons/:id — delete lesson
  if (slug.length === 2 && slug[0] === 'lessons' && method === 'DELETE') {
    return lessonHandler.DELETE(slug[1], request)
  }

  // GET /lessons/:id/steps — list steps for a lesson
  if (slug.length === 3 && slug[0] === 'lessons' && slug[2] === 'steps' && method === 'GET') {
    return lessonStepsHandler.GET(slug[1])
  }

  // POST /lessons/:id/steps — create a step
  if (slug.length === 3 && slug[0] === 'lessons' && slug[2] === 'steps' && method === 'POST') {
    return lessonStepsHandler.POST(slug[1], request)
  }

  // PATCH /lessons/:id/steps/:stepId — update a step
  if (slug.length === 4 && slug[0] === 'lessons' && slug[2] === 'steps' && method === 'PATCH') {
    return lessonStepsHandler.PATCH(slug[1], slug[3], request)
  }

  // DELETE /lessons/:id/steps/:stepId — delete a step
  if (slug.length === 4 && slug[0] === 'lessons' && slug[2] === 'steps' && method === 'DELETE') {
    return lessonStepsHandler.DELETE(slug[1], slug[3])
  }

  // GET /progress — progress by subject
  if (slug.length === 1 && slug[0] === 'progress' && method === 'GET') {
    return progressHandler.GET(request)
  }

  // GET /history — completed lesson history
  if (slug.length === 1 && slug[0] === 'history' && method === 'GET') {
    return historyHandler.GET(request)
  }

  return null
}
