import { NextResponse } from 'next/server'
import * as summaryHandler from './routes/summary'
import * as usersHandler from './routes/users'
import * as eventsHandler from './routes/events'

/** Handles /api/admin/metrics/* */
export async function handleAdminMetricsRoute(
  slug: string[],
  request: Request,
): Promise<NextResponse | null> {
  if (slug[0] !== 'metrics') return null

  const method = request.method
  const rest = slug.slice(1)

  if (rest[0] === 'summary' && rest.length === 1 && method === 'GET') {
    return summaryHandler.GET(request) as Promise<NextResponse>
  }
  if (rest[0] === 'users' && rest.length === 1 && method === 'GET') {
    return usersHandler.GET(request) as Promise<NextResponse>
  }
  if (rest[0] === 'events' && rest.length === 1 && method === 'GET') {
    return eventsHandler.GET(request) as Promise<NextResponse>
  }

  return null
}
