import { NextResponse } from 'next/server'
import * as childrenHandler from './routes/children'
import * as childHandler from './routes/child'

export async function handleChildrenRoute(
  slug: string[],
  request: Request
): Promise<NextResponse | null> {
  const method = request.method

  // GET /children — list children
  if (slug.length === 1 && slug[0] === 'children' && method === 'GET') {
    return childrenHandler.GET(request)
  }

  // POST /children — create child
  if (slug.length === 1 && slug[0] === 'children' && method === 'POST') {
    return childrenHandler.POST(request)
  }

  // GET /children/:id — get single child
  if (slug.length === 2 && slug[0] === 'children' && method === 'GET') {
    return childHandler.GET(slug[1])
  }

  // PUT /children/:id — update child
  if (slug.length === 2 && slug[0] === 'children' && method === 'PUT') {
    return childHandler.PUT(slug[1], request)
  }

  // PATCH /children/:id/archive — archive child
  if (slug.length === 3 && slug[0] === 'children' && slug[2] === 'archive' && method === 'PATCH') {
    return childHandler.ARCHIVE(slug[1])
  }

  // PATCH /children/:id/restore — restore child
  if (slug.length === 3 && slug[0] === 'children' && slug[2] === 'restore' && method === 'PATCH') {
    return childHandler.RESTORE(slug[1])
  }

  return null
}
