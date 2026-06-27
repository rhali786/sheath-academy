import { NextResponse } from 'next/server'
import * as statusHandler from './routes/status'
import * as rulesetHandler from './routes/ruleset'
import * as deadlinesHandler from './routes/deadlines'
import * as submissionsHandler from './routes/submissions'

export async function handleComplianceRoute(
  slug: string[],
  request: Request,
): Promise<NextResponse | null> {
  const method = request.method

  // GET /status?schoolYearId=
  if (slug.length === 1 && slug[0] === 'status' && method === 'GET') {
    return statusHandler.GET(request)
  }

  // GET /ruleset
  if (slug.length === 1 && slug[0] === 'ruleset' && method === 'GET') {
    return rulesetHandler.GET(request)
  }

  // GET /deadlines?schoolYearId=
  if (slug.length === 1 && slug[0] === 'deadlines' && method === 'GET') {
    return deadlinesHandler.GET(request)
  }

  // GET /submissions?schoolYearId=
  if (slug.length === 1 && slug[0] === 'submissions' && method === 'GET') {
    return submissionsHandler.GET(request)
  }

  return null
}
