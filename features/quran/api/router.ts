import { NextResponse } from 'next/server'
import * as sessionsHandler from './routes/sessions'
import * as summaryHandler from './routes/summary'

export async function handleQuranRoute(
  slug: string[],
  request: Request
): Promise<NextResponse | null> {
  const method = request.method

  // Handle /quran/sessions
  if (slug.length === 1 && slug[0] === 'sessions') {
    if (method === 'GET') return sessionsHandler.GET(request)
    if (method === 'POST') return sessionsHandler.POST(request)
  }

  // Handle /quran/summary
  if (slug.length === 1 && slug[0] === 'summary' && method === 'GET') {
    return summaryHandler.GET(request)
  }

  return null
}
