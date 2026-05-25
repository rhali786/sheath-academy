import { NextResponse } from 'next/server'
import * as adminListHandler from './routes/adminList'

/** Handles GET /api/admin/feedback */
export async function handleAdminFeedbackRoute(
  slug: string[],
  request: Request,
): Promise<NextResponse | null> {
  if (slug[0] === 'feedback' && slug.length === 1 && request.method === 'GET') {
    return adminListHandler.GET(request) as Promise<NextResponse>
  }
  return null
}
