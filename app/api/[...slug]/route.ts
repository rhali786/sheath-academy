import { NextResponse } from 'next/server'
import { handleDashboardRoute } from '@/features/dashboard/api/router'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<NextResponse | Response> {
  const { slug } = await params

  // Only handle dashboard routes
  if (slug[0] === 'dashboard') {
    const dashboardSlug = slug.slice(1)
    const response = await handleDashboardRoute(dashboardSlug, request)
    if (response) return response
  }

  return NextResponse.json(
    {
      status: 'error',
      data: null,
      message: 'Not found',
      timestamp: new Date().toISOString(),
    },
    { status: 404 }
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<NextResponse | Response> {
  const { slug } = await params

  // Only handle dashboard routes
  if (slug[0] === 'dashboard') {
    const dashboardSlug = slug.slice(1)
    const response = await handleDashboardRoute(dashboardSlug, request)
    if (response) return response
  }

  return NextResponse.json(
    {
      status: 'error',
      data: null,
      message: 'Not found',
      timestamp: new Date().toISOString(),
    },
    { status: 404 }
  )
}
