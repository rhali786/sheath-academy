import { NextResponse } from 'next/server'
import { handleDashboardRoute } from '@/features/dashboard/api/router'
import { handleHouseholdRoute } from '@/features/household/api/router'
import { handleChildrenRoute } from '@/features/children/api/router'

async function handleRoute(slug: string[], request: Request): Promise<NextResponse | null> {
  if (slug[0] === 'dashboard') {
    return await handleDashboardRoute(slug.slice(1), request)
  }

  if (slug[0] === 'household') {
    return await handleHouseholdRoute(slug.slice(1), request)
  }

  if (slug[0] === 'children') {
    return await handleChildrenRoute(slug.slice(1), request)
  }

  return null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<NextResponse | Response> {
  const { slug } = await params
  const response = await handleRoute(slug, request)
  if (response) return response

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
  const response = await handleRoute(slug, request)
  if (response) return response

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<NextResponse | Response> {
  const { slug } = await params
  const response = await handleRoute(slug, request)
  if (response) return response

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<NextResponse | Response> {
  const { slug } = await params
  const response = await handleRoute(slug, request)
  if (response) return response

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
