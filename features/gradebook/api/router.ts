import { NextResponse } from 'next/server'
import * as summariesHandler from './routes/summaries'
import * as scoresHandler from './routes/scores'
import * as scoresIdHandler from './routes/scores-id'

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

  // POST /scores
  if (slug.length === 1 && slug[0] === 'scores' && method === 'POST') {
    return scoresHandler.POST(request)
  }

  // PATCH /scores/:id
  if (slug.length === 2 && slug[0] === 'scores' && method === 'PATCH') {
    return scoresIdHandler.PATCH(slug[1], request)
  }

  // DELETE /scores/:id
  if (slug.length === 2 && slug[0] === 'scores' && method === 'DELETE') {
    return scoresIdHandler.DELETE(slug[1])
  }

  return null
}
