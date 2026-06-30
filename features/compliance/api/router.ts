import { NextResponse } from 'next/server'
import * as statusHandler from './routes/status'
import * as rulesetHandler from './routes/ruleset'
import * as rulesetsHandler from './routes/rulesets'
import * as deadlinesHandler from './routes/deadlines'
import * as deadlinesIdHandler from './routes/deadlines-id'
import * as submissionsHandler from './routes/submissions'
import * as submissionsIdHandler from './routes/submissions-id'
import * as configHandler from './routes/config'

export async function handleComplianceRoute(
  slug: string[],
  request: Request,
): Promise<NextResponse | null> {
  const method = request.method

  // GET /status?schoolYearId=
  if (slug.length === 1 && slug[0] === 'status' && method === 'GET') {
    return statusHandler.GET(request)
  }

  // GET /ruleset — active ruleset for the household
  if (slug.length === 1 && slug[0] === 'ruleset' && method === 'GET') {
    return rulesetHandler.GET(request)
  }

  // GET /rulesets — all selectable platform rulesets
  if (slug.length === 1 && slug[0] === 'rulesets' && method === 'GET') {
    return rulesetsHandler.GET(request)
  }

  // PUT /config — set active ruleset / pathway
  if (slug.length === 1 && slug[0] === 'config' && method === 'PUT') {
    return configHandler.PUT(request)
  }

  // GET /deadlines?schoolYearId=
  if (slug.length === 1 && slug[0] === 'deadlines' && method === 'GET') {
    return deadlinesHandler.GET(request)
  }

  // POST /deadlines
  if (slug.length === 1 && slug[0] === 'deadlines' && method === 'POST') {
    return deadlinesHandler.POST(request)
  }

  // PATCH /deadlines/:id
  if (slug.length === 2 && slug[0] === 'deadlines' && method === 'PATCH') {
    return deadlinesIdHandler.PATCH(slug[1], request)
  }

  // DELETE /deadlines/:id
  if (slug.length === 2 && slug[0] === 'deadlines' && method === 'DELETE') {
    return deadlinesIdHandler.DELETE(slug[1])
  }

  // GET /submissions?schoolYearId=
  if (slug.length === 1 && slug[0] === 'submissions' && method === 'GET') {
    return submissionsHandler.GET(request)
  }

  // POST /submissions
  if (slug.length === 1 && slug[0] === 'submissions' && method === 'POST') {
    return submissionsHandler.POST(request)
  }

  // PATCH /submissions/:id
  if (slug.length === 2 && slug[0] === 'submissions' && method === 'PATCH') {
    return submissionsIdHandler.PATCH(slug[1], request)
  }

  // DELETE /submissions/:id
  if (slug.length === 2 && slug[0] === 'submissions' && method === 'DELETE') {
    return submissionsIdHandler.DELETE(slug[1])
  }

  return null
}
