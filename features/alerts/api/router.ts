import { NextResponse } from 'next/server'
import * as alertsHandler from './routes/alerts'

export async function handleAlertsRoute(
  slug: string[],
  request: Request
): Promise<NextResponse | null> {
  if (slug.length === 0 && request.method === 'GET') {
    return alertsHandler.GET(request)
  }
  return null
}
