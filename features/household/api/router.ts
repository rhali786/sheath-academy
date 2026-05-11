import { NextResponse } from 'next/server'
import * as workspaceHandler from './routes/workspace'
import * as householdProfileHandler from './routes/household-profile'

export async function handleHouseholdRoute(
  slug: string[],
  request: Request
): Promise<NextResponse | null> {
  const method = request.method

  // GET /household/workspace
  if (slug.length === 1 && slug[0] === 'workspace' && method === 'GET') {
    return workspaceHandler.GET()
  }

  // GET /household/profile
  if (slug.length === 1 && slug[0] === 'profile' && method === 'GET') {
    return householdProfileHandler.GET()
  }

  return null
}
