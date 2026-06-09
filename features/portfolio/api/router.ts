import { NextResponse } from 'next/server'
import * as evidenceHandler from './routes/evidence'
import * as evidenceIdHandler from './routes/evidence-id'
import * as evidenceAttachmentsHandler from './routes/evidence-attachments'

export async function handlePortfolioRoute(
  slug: string[],
  request: Request
): Promise<NextResponse | Response | null> {
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

  // POST /api/portfolio/evidence/:id/attachments
  if (slug.length === 3 && slug[0] === 'evidence' && slug[2] === 'attachments' && method === 'POST') {
    return evidenceAttachmentsHandler.POST(slug[1], request)
  }

  // GET /api/portfolio/evidence/attachments/:attachmentId
  if (slug.length === 3 && slug[0] === 'evidence' && slug[1] === 'attachments' && method === 'GET') {
    return evidenceAttachmentsHandler.GET(slug[2])
  }

  // DELETE /api/portfolio/evidence/attachments/:attachmentId
  if (slug.length === 3 && slug[0] === 'evidence' && slug[1] === 'attachments' && method === 'DELETE') {
    return evidenceAttachmentsHandler.DELETE(slug[2])
  }

  return null
}
