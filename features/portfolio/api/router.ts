import { NextResponse } from 'next/server'
import * as evidenceHandler from './routes/evidence'
import * as evidenceIdHandler from './routes/evidence-id'

export async function handlePortfolioRoute(
  slug: string[],
  request: Request
): Promise<NextResponse | null> {
  const method = request.method

  if (slug.length === 0 && method === 'GET') {
    return evidenceHandler.GET(request)
  }

  if (slug.length === 0 && method === 'POST') {
    return evidenceHandler.POST(request)
  }

  if (slug.length === 1 && slug[0] === 'evidence' && method === 'GET') {
    return evidenceHandler.GET(request)
  }

  if (slug.length === 1 && slug[0] === 'evidence' && method === 'POST') {
    return evidenceHandler.POST(request)
  }

  if (slug.length === 2 && slug[0] === 'evidence' && method === 'GET') {
    return evidenceIdHandler.GET(slug[1])
  }

  if (slug.length === 2 && slug[0] === 'evidence' && method === 'PUT') {
    return evidenceIdHandler.PUT(slug[1], request)
  }

  if (slug.length === 2 && slug[0] === 'evidence' && method === 'DELETE') {
    return evidenceIdHandler.DELETE(slug[1])
  }

  return null
}
