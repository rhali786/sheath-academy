import { NextResponse } from 'next/server'
import * as definitionsHandler from './routes/definitions'
import * as collectionHandler from './routes/collection'
import * as awardsHandler from './routes/awards'
import * as settingsHandler from './routes/settings'

export async function handleBadgesRoute(
  slug: string[],
  request: Request,
): Promise<NextResponse | null> {
  const method = request.method

  // GET /definitions
  if (slug.length === 1 && slug[0] === 'definitions' && method === 'GET') {
    return definitionsHandler.GET(request)
  }

  // GET /collection?learnerId=
  if (slug.length === 1 && slug[0] === 'collection' && method === 'GET') {
    return collectionHandler.GET(request)
  }

  // GET /awards?learnerId=
  if (slug.length === 1 && slug[0] === 'awards' && method === 'GET') {
    return awardsHandler.GET(request)
  }

  // GET /settings
  if (slug.length === 1 && slug[0] === 'settings' && method === 'GET') {
    return settingsHandler.GET(request)
  }

  return null
}
