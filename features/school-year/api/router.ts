import { NextResponse } from 'next/server'
import * as schoolYearsHandler from './routes/school-years'
import * as schoolYearHandler from './routes/school-year'

export async function handleSchoolYearsRoute(
  slug: string[],
  request: Request
): Promise<NextResponse | null> {
  const method = request.method

  // GET /school-years — list all
  if (slug.length === 0 && method === 'GET') {
    return schoolYearsHandler.GET()
  }

  // POST /school-years — create
  if (slug.length === 0 && method === 'POST') {
    return schoolYearsHandler.POST(request)
  }

  // GET /school-years/active — get active year
  if (slug.length === 1 && slug[0] === 'active' && method === 'GET') {
    return schoolYearsHandler.GET_ACTIVE()
  }

  // GET /school-years/:id — get single
  if (slug.length === 1 && method === 'GET') {
    return schoolYearHandler.GET(slug[0])
  }

  // PUT /school-years/:id — update
  if (slug.length === 1 && method === 'PUT') {
    return schoolYearHandler.PUT(slug[0], request)
  }

  // PATCH /school-years/:id/activate — activate
  if (slug.length === 2 && slug[1] === 'activate' && method === 'PATCH') {
    return schoolYearHandler.ACTIVATE(slug[0])
  }

  return null
}
