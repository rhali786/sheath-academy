import { NextResponse } from 'next/server'
import * as adminListHandler from './routes/adminList'
import * as adminApproveHandler from './routes/adminApprove'
import * as adminRejectHandler from './routes/adminReject'

export async function handleAdminFeedbackRoute(
  slug: string[],
  request: Request,
): Promise<NextResponse | null> {
  if (slug[0] === 'feedback' && slug.length === 1 && request.method === 'GET') {
    return adminListHandler.GET(request) as Promise<NextResponse>
  }
  if (slug[0] === 'feedback' && slug.length === 3 && slug[2] === 'approve' && request.method === 'POST') {
    return adminApproveHandler.POST(request, slug[1]) as Promise<NextResponse>
  }
  if (slug[0] === 'feedback' && slug.length === 3 && slug[2] === 'reject' && request.method === 'POST') {
    return adminRejectHandler.POST(request, slug[1]) as Promise<NextResponse>
  }
  return null
}
