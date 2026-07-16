import { NextResponse } from 'next/server'
import * as settingsHandler from './routes/settings'

export async function handleSettingsRoute(
  slug: string[],
  request: Request,
): Promise<NextResponse | null> {
  const method = request.method

  // GET /settings
  if (slug.length === 0 && method === 'GET') {
    return settingsHandler.GET(request)
  }

  // PUT /settings
  if (slug.length === 0 && method === 'PUT') {
    return settingsHandler.PUT(request)
  }

  return null
}
