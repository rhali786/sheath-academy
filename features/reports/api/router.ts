import { NextResponse } from 'next/server'
import * as summaryHandler from './routes/summary'

export async function handleReportsRoute(
  slug: string[],
  request: Request
): Promise<NextResponse | null> {
  const method = request.method

  if (slug.length === 1 && slug[0] === 'summary' && method === 'GET') {
    return summaryHandler.GET(request)
  }

  return null
}
