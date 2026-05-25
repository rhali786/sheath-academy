import { NextResponse } from 'next/server'
import * as submitHandler from './routes/submit'

/** Handles POST /api/feedback */
export async function handleFeedbackRoute(
  slug: string[],
  request: Request,
): Promise<NextResponse | null> {
  if (slug.length === 0 && request.method === 'POST') {
    return submitHandler.POST(request) as Promise<NextResponse>
  }
  return null
}
