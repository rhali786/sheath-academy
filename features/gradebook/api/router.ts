import { NextResponse } from 'next/server'
import * as summariesHandler from './routes/summaries'
import * as scoresHandler from './routes/scores'

export async function handleGradebookRoute(
  slug: string[],
  request: Request,
): Promise<NextResponse | null> {
  const method = request.method

  // GET /summaries
  if (slug.length === 1 && slug[0] === 'summaries' && method === 'GET') {
    return summariesHandler.GET(request)
  }

  // GET /scores?learnerId=&subjectId=
  if (slug.length === 1 && slug[0] === 'scores' && method === 'GET') {
    return scoresHandler.GET(request)
  }

  return null
}
