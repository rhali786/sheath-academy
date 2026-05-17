import { NextResponse } from 'next/server'
import * as summaryHandler from './routes/summary'
import * as tasksHandler from './routes/tasks'
import * as tasksCompleteHandler from './routes/tasks-complete'
import * as alertsHandler from './routes/alerts'
import * as quranHandler from './routes/quran'
import * as recordsHandler from './routes/records'

export async function handleDashboardRoute(
  slug: string[],
  request: Request
): Promise<NextResponse | null> {
  const method = request.method

  // Build path from slug
  // slug could be: ['summary'], ['tasks'], ['tasks', 'id123', 'complete'], ['alerts'], etc.

  // Handle /dashboard/summary
  if (slug.length === 1 && slug[0] === 'summary' && method === 'GET') {
    return summaryHandler.GET(request)
  }

  // Handle /dashboard/tasks
  if (slug.length === 1 && slug[0] === 'tasks' && method === 'GET') {
    return tasksHandler.GET()
  }

  // Handle /dashboard/tasks/[id]/complete
  if (slug.length === 3 && slug[1] === 'complete' && method === 'POST') {
    const taskId = slug[0]
    return tasksCompleteHandler.POST(request, { params: Promise.resolve({ id: taskId }) })
  }

  // Handle /dashboard/alerts
  if (slug.length === 1 && slug[0] === 'alerts' && method === 'GET') {
    return alertsHandler.GET(request)
  }

  // Handle /dashboard/quran
  if (slug.length === 1 && slug[0] === 'quran') {
    if (method === 'GET') {
      return quranHandler.GET(request)
    }
    if (method === 'POST') {
      return quranHandler.POST(request)
    }
  }

  // Handle /dashboard/records
  if (slug.length === 1 && slug[0] === 'records' && method === 'GET') {
    return recordsHandler.GET(request)
  }

  return null
}
