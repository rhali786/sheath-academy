import type { NextResponse } from 'next/server'
import {
  handleListResources,
  handleCreateResource,
  handleGetResource,
  handleUpdateVerification,
  handleCalculatePace,
  handleGenerateLessons,
} from './routes/resources'

export async function handleResourcesRoute(
  slug: string[],
  request: Request,
): Promise<NextResponse | null> {
  // GET /api/resources
  if (slug.length === 0 && request.method === 'GET') {
    return handleListResources(request)
  }
  // POST /api/resources
  if (slug.length === 0 && request.method === 'POST') {
    return handleCreateResource(request)
  }
  // GET /api/resources/:id
  if (slug.length === 1 && request.method === 'GET') {
    return handleGetResource(slug[0])
  }
  // PATCH /api/resources/:id/verification
  if (slug.length === 2 && slug[1] === 'verification' && request.method === 'PATCH') {
    return handleUpdateVerification(slug[0], request)
  }
  // POST /api/resources/pace
  if (slug[0] === 'pace' && request.method === 'POST') {
    return handleCalculatePace(request)
  }
  // POST /api/resources/generate-lessons
  if (slug[0] === 'generate-lessons' && request.method === 'POST') {
    return handleGenerateLessons(request)
  }
  return null
}
