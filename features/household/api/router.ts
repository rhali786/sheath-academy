import { NextResponse } from 'next/server'
import * as householdProfileHandler from './routes/household-profile'

export async function handleHouseholdRoute(
  slug: string[],
  request: Request
): Promise<NextResponse | null> {
  const method = request.method

  // GET /household/profile
  if (slug.length === 1 && slug[0] === 'profile' && method === 'GET') {
    return householdProfileHandler.GET()
  }

  // POST /household/profile — first-time setup (set household name)
  if (slug.length === 1 && slug[0] === 'profile' && method === 'POST') {
    return householdProfileHandler.POST(request)
  }

  // PUT /household/profile  — rename household
  if (slug.length === 1 && slug[0] === 'profile' && method === 'PUT') {
    return householdProfileHandler.PUT(request)
  }

  return null
}
