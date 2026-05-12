import { NextResponse } from 'next/server'
import { handleDashboardRoute } from '@/features/dashboard/api/router'
import { handleHouseholdRoute } from '@/features/household/api/router'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<NextResponse | Response> {
  const { slug } = await params

  if (slug[0] === 'dashboard') {
    const response = await handleDashboardRoute(slug.slice(1), request)
    if (response) return response
  }

  if (slug[0] === 'household') {
    const response = await handleHouseholdRoute(slug.slice(1), request)
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

  if (slug[0] === 'dashboard') {
    const response = await handleDashboardRoute(slug.slice(1), request)
    if (response) return response
  }

  if (slug[0] === 'household') {
    const response = await handleHouseholdRoute(slug.slice(1), request)
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
