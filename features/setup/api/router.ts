import { NextResponse } from 'next/server'
import * as setupStatusHandler from './routes/setup-status'

export async function handleSetupStatusRoute(
  slug: string[],
  request: Request
): Promise<NextResponse | null> {
  const method = request.method

  if (slug.length === 0 && method === 'GET') {
    return setupStatusHandler.GET()
  }

  return null
}
