import { NextResponse } from 'next/server'
import * as responsesHandler from './routes/responses'
import * as responsesIdHandler from './routes/responses-id'
import * as summaryHandler from './routes/summary'

export async function handleProductValidationRoute(
  slug: string[],
  request: Request,
): Promise<NextResponse | null> {
  const method = request.method

  if (slug[0] === 'responses' && slug.length === 1) {
    if (method === 'POST') return responsesHandler.POST(request) as Promise<NextResponse>
    if (method === 'GET') return responsesHandler.GET(request) as Promise<NextResponse>
  }

  if (slug[0] === 'responses' && slug.length === 2 && method === 'GET') {
    return responsesIdHandler.GET(request, slug[1]) as Promise<NextResponse>
  }

  if (slug[0] === 'summary' && slug.length === 1 && method === 'GET') {
    return summaryHandler.GET(request) as Promise<NextResponse>
  }

  return null
}
