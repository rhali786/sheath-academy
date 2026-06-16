import { NextResponse } from 'next/server'
import * as sessionsHandler from './routes/learning-time'

export async function handleLearningTimeRoute(
  slug: string[],
  request: Request
): Promise<NextResponse | null> {
  const method = request.method

  // Handle /learning-time/sessions
  if (slug.length === 1 && slug[0] === 'sessions') {
    if (method === 'GET') return sessionsHandler.GET(request)
    if (method === 'POST') return sessionsHandler.POST(request)
  }

  // Handle /learning-time/sessions/active
  if (slug.length === 2 && slug[0] === 'sessions' && slug[1] === 'active' && method === 'GET') {
    return sessionsHandler.GET_ACTIVE(request)
  }

  // Handle /learning-time/sessions/:id
  if (slug.length === 2 && slug[0] === 'sessions' && method === 'PATCH') {
    const id = slug[1]
    return sessionsHandler.PATCH(request, { params: Promise.resolve({ id }) })
  }

  return null
}
