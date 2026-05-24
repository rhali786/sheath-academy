import { NextResponse, type NextRequest } from 'next/server'
import { requireAuthCtx } from '@/features/auth/server/context'
import { runWithAuthCtx } from '@/features/auth/server/requestAuth'
import { handleDashboardRoute } from '@/features/dashboard/api/router'
import { handleHouseholdRoute } from '@/features/household/api/router'
import { handleChildrenRoute } from '@/features/children/api/router'
import { handleSubjectsRoute } from '@/features/subjects/api/router'
import { handleSchoolYearsRoute } from '@/features/school-year/api/router'
import { handleSetupStatusRoute } from '@/features/setup/api/router'
import { handlePlanRoute } from '@/features/plan/api/router'
import { handleAttendanceRoute } from '@/features/attendance/api/router'
import { handlePortfolioRoute } from '@/features/portfolio/api/router'
import { handleRecordsRoute } from '@/features/records/api/router'
import { handleAlertsRoute } from '@/features/alerts/api/router'
import { handleQuranRoute } from '@/features/quran/api/router'
import { handleScheduleRoute } from '@/features/schedule/api/router'
import { handleResourcesRoute } from '@/features/resources/api/router'
import { handleProductValidationRoute } from '@/features/product-validation/api/router'
import { handleAdminMetricsRoute } from '@/features/admin-metrics/api/router'
import { latencyTrace } from '@/features/lib/debug/latencyTrace'

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

  if (slug[0] === 'plan') {
    return await handlePlanRoute(slug.slice(1), request)
  }

  if (slug[0] === 'subjects') {
    return await handleSubjectsRoute(slug.slice(1), request)
  }

  if (slug[0] === 'school-years') {
    return await handleSchoolYearsRoute(slug.slice(1), request)
  }

  if (slug[0] === 'setup-status') {
    return await handleSetupStatusRoute(slug.slice(1), request)
  }

  if (slug[0] === 'attendance') {
    return await handleAttendanceRoute(slug.slice(1), request)
  }

  if (slug[0] === 'portfolio') {
    return await handlePortfolioRoute(slug.slice(1), request)
  }

  if (slug[0] === 'records') {
    return await handleRecordsRoute(slug.slice(1), request)
  }

  if (slug[0] === 'alerts') {
    return await handleAlertsRoute(slug.slice(1), request)
  }

  if (slug[0] === 'quran') {
    return await handleQuranRoute(slug.slice(1), request)
  }

  if (slug[0] === 'schedule') {
    return await handleScheduleRoute(slug.slice(1), request)
  }

  if (slug[0] === 'resources') {
    return await handleResourcesRoute(slug.slice(1), request)
  }

  if (slug[0] === 'product-validation') {
    return await handleProductValidationRoute(slug.slice(1), request)
  }

  if (slug[0] === 'admin') {
    return await handleAdminMetricsRoute(slug.slice(1), request)
  }

  return null
}

async function dispatch(
  request: Request,
  params: Promise<{ slug: string[] }>,
): Promise<NextResponse | Response> {
  const routeT0 = Date.now()
  const authT0 = Date.now()
  const authResult = await requireAuthCtx(request as NextRequest)
  const authMs = Date.now() - authT0
  if (authResult instanceof Response) return authResult

  const { slug } = await params
  const path = `/api/${slug.join('/')}`
  const handlerT0 = Date.now()
  const response = await runWithAuthCtx(authResult, () => handleRoute(slug, request))
  const handlerMs = Date.now() - handlerT0
  latencyTrace(
    'route.ts:dispatch',
    'api_request',
    { path, authMs, handlerMs, totalMs: Date.now() - routeT0 },
    'E',
  )
  if (response) return response

  return NextResponse.json(
    {
      status: 'error',
      data: null,
      message: 'Not found',
      timestamp: new Date().toISOString(),
    },
    { status: 404 },
  )
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string[] }> },
): Promise<NextResponse | Response> {
  return dispatch(request, context.params)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string[] }> },
): Promise<NextResponse | Response> {
  return dispatch(request, context.params)
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string[] }> },
): Promise<NextResponse | Response> {
  return dispatch(request, context.params)
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string[] }> },
): Promise<NextResponse | Response> {
  return dispatch(request, context.params)
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string[] }> },
): Promise<NextResponse | Response> {
  return dispatch(request, context.params)
}
