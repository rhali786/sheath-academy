import { NextResponse } from 'next/server'
import * as submitHandler from './routes/submit'
import * as userListHandler from './routes/userList'
import * as userDetailHandler from './routes/userDetail'

export async function handleFeedbackRoute(
  slug: string[],
  request: Request,
): Promise<NextResponse | null> {
  if (slug.length === 0 && request.method === 'POST') {
    return submitHandler.POST(request) as Promise<NextResponse>
  }
  if (slug.length === 0 && request.method === 'GET') {
    return userListHandler.GET(request) as Promise<NextResponse>
  }
  if (slug.length === 1 && request.method === 'GET') {
    return userDetailHandler.GET(request, slug[0]) as Promise<NextResponse>
  }
  return null
}
