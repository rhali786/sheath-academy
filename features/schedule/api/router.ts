import type { NextResponse } from 'next/server'
import { handleScheduleToday, handleScheduleTemplates } from './routes/schedule'

export async function handleScheduleRoute(
  slug: string[],
  request: Request,
): Promise<NextResponse | null> {
  if (slug[0] === 'today' && request.method === 'GET') {
    return handleScheduleToday(request)
  }
  if (slug[0] === 'templates' && request.method === 'GET') {
    return handleScheduleTemplates()
  }
  return null
}
