import { NextResponse } from 'next/server'
import * as subjectsHandler from './routes/subjects'
import * as subjectHandler from './routes/subject'
import * as rolloverHandler from './routes/rollover'

export async function handleSubjectsRoute(
  slug: string[],
  request: Request
): Promise<NextResponse | null> {
  const method = request.method

  // POST /subjects/rollover — roll courses into a target school year
  if (slug.length === 1 && slug[0] === 'rollover' && method === 'POST') {
    return rolloverHandler.POST(request)
  }

  // GET /subjects — list subjects (with optional ?childId= filter)
  if (slug.length === 0 && method === 'GET') {
    return subjectsHandler.GET(request)
  }

  // POST /subjects — create subject
  if (slug.length === 0 && method === 'POST') {
    return subjectsHandler.POST(request)
  }

  // GET /subjects/:id — get single subject
  if (slug.length === 1 && method === 'GET') {
    return subjectHandler.GET(slug[0])
  }

  // PUT /subjects/:id — update subject
  if (slug.length === 1 && method === 'PUT') {
    return subjectHandler.PUT(slug[0], request)
  }

  // PATCH /subjects/:id/archive — archive subject
  if (slug.length === 2 && slug[1] === 'archive' && method === 'PATCH') {
    return subjectHandler.ARCHIVE(slug[0])
  }

  // PATCH /subjects/:id/restore — restore subject
  if (slug.length === 2 && slug[1] === 'restore' && method === 'PATCH') {
    return subjectHandler.RESTORE(slug[0])
  }

  return null
}
