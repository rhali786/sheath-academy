import { NextResponse } from 'next/server'
import * as attendanceHandler from './routes/attendance'
import * as attendanceIdHandler from './routes/attendance-id'
import * as summaryHandler from './routes/summary'

export async function handleAttendanceRoute(
  slug: string[],
  request: Request
): Promise<NextResponse | null> {
  const method = request.method

  // GET /attendance — list records
  if (slug.length === 0 && method === 'GET') {
    return attendanceHandler.GET(request)
  }

  // POST /attendance — create record
  if (slug.length === 0 && method === 'POST') {
    return attendanceHandler.POST(request)
  }

  // GET /attendance/summary — summary counts
  if (slug.length === 1 && slug[0] === 'summary' && method === 'GET') {
    return summaryHandler.GET(request)
  }

  // GET /attendance/:id
  if (slug.length === 1 && method === 'GET') {
    return attendanceIdHandler.GET(slug[0])
  }

  // PATCH /attendance/:id
  if (slug.length === 1 && method === 'PATCH') {
    return attendanceIdHandler.PATCH(slug[0], request)
  }

  // DELETE /attendance/:id
  if (slug.length === 1 && method === 'DELETE') {
    return attendanceIdHandler.DELETE(slug[0])
  }

  return null
}
