import { NextResponse } from 'next/server'
import * as definitionsHandler from './routes/definitions'
import * as definitionsIdHandler from './routes/definitions-id'
import * as collectionHandler from './routes/collection'
import * as awardsHandler from './routes/awards'
import * as awardsIdHandler from './routes/awards-id'
import * as awardsEvidenceHandler from './routes/awards-evidence'
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

  // POST /definitions — author a custom badge
  if (slug.length === 1 && slug[0] === 'definitions' && method === 'POST') {
    return definitionsHandler.POST(request)
  }

  // PATCH /definitions/:id
  if (slug.length === 2 && slug[0] === 'definitions' && method === 'PATCH') {
    return definitionsIdHandler.PATCH(slug[1], request)
  }

  // DELETE /definitions/:id
  if (slug.length === 2 && slug[0] === 'definitions' && method === 'DELETE') {
    return definitionsIdHandler.DELETE(slug[1])
  }

  // GET /collection?learnerId=
  if (slug.length === 1 && slug[0] === 'collection' && method === 'GET') {
    return collectionHandler.GET(request)
  }

  // GET /awards?learnerId=
  if (slug.length === 1 && slug[0] === 'awards' && method === 'GET') {
    return awardsHandler.GET(request)
  }

  // POST /awards
  if (slug.length === 1 && slug[0] === 'awards' && method === 'POST') {
    return awardsHandler.POST(request)
  }

  // POST /awards/:id/evidence
  if (slug.length === 3 && slug[0] === 'awards' && slug[2] === 'evidence' && method === 'POST') {
    return awardsEvidenceHandler.POST(slug[1], request)
  }

  // DELETE /awards/:id/evidence/:evidenceLinkId
  if (slug.length === 4 && slug[0] === 'awards' && slug[2] === 'evidence' && method === 'DELETE') {
    return awardsEvidenceHandler.DELETE(slug[1], slug[3])
  }

  // PATCH /awards/:id
  if (slug.length === 2 && slug[0] === 'awards' && method === 'PATCH') {
    return awardsIdHandler.PATCH(slug[1], request)
  }

  // DELETE /awards/:id
  if (slug.length === 2 && slug[0] === 'awards' && method === 'DELETE') {
    return awardsIdHandler.DELETE(slug[1])
  }

  // GET /settings
  if (slug.length === 1 && slug[0] === 'settings' && method === 'GET') {
    return settingsHandler.GET(request)
  }

  // PUT /settings
  if (slug.length === 1 && slug[0] === 'settings' && method === 'PUT') {
    return settingsHandler.PUT(request)
  }

  return null
}
