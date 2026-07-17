import { NextResponse } from 'next/server'
import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { getFeedbackScreenshot } from '@/features/feedback/server/repository'
import { isAppAdmin } from '@/features/lib/server/appAdmin'

/** GET /api/feedback/:id/screenshot — serves the raw attached image bytes for owner or admin. Mirrors features/messaging/api/routes/attachments.ts. */
export async function GET(request: Request, id: string): Promise<Response> {
  const { userId, email } = getRequestAuthCtx()
  if (!userId) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Unauthorized', timestamp: new Date().toISOString() },
      { status: 401 },
    )
  }

  const screenshot = await getFeedbackScreenshot(id)
  if (!screenshot) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Not found', timestamp: new Date().toISOString() },
      { status: 404 },
    )
  }

  const isAdmin = email ? isAppAdmin(email) : false
  if (screenshot.userId !== userId && !isAdmin) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Forbidden', timestamp: new Date().toISOString() },
      { status: 403 },
    )
  }

  return new Response(new Uint8Array(screenshot.data), {
    headers: { 'Content-Type': screenshot.mimeType },
  })
}
