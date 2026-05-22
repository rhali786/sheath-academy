import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { ProductValidationResponse } from '@/features/product-validation/types'
import { getAuthCtx, unauthorizedResponse } from '@/features/auth/server/context'
import { requireAdminApi } from '@/features/lib/server/requireAdminApi'
import {
  createProductValidationResponse,
  listProductValidationResponses,
  ProductValidationValidationError,
} from '@/features/product-validation/server/service'
import type { CreateProductValidationInput } from '@/features/product-validation/types'

function validationErrorResponse(
  errors: { field: string; message: string }[],
): Response {
  return NextResponse.json(
    {
      status: 'error',
      data: errors,
      message: 'Validation failed',
      timestamp: new Date().toISOString(),
    },
    { status: 400 },
  )
}

export async function POST(request: Request): Promise<Response> {
  const authCtx = await getAuthCtx(request as NextRequest)
  if (!authCtx) return unauthorizedResponse()

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return validationErrorResponse([{ field: 'body', message: 'Invalid JSON body' }])
  }

  // Never trust client-computed fit score.
  const { forkTestFitScore: _ignored, ...rest } = body

  try {
    const { auth } = await import('@/features/auth/auth')
    const session = await auth()
    const sessionEmail = session?.user?.email ?? (rest.respondentEmail as string) ?? ''

    const record = createProductValidationResponse(
      authCtx,
      rest as CreateProductValidationInput,
      sessionEmail,
    )

    return NextResponse.json({
      status: 'success',
      data: record,
      message: 'Product validation response saved',
      timestamp: new Date().toISOString(),
    } satisfies ApiResponse<ProductValidationResponse>)
  } catch (e) {
    if (e instanceof ProductValidationValidationError) {
      return validationErrorResponse(e.errors)
    }
    throw e
  }
}

export async function GET(request: Request): Promise<Response> {
  const gate = await requireAdminApi(request)
  if (!gate.ok) return gate.response

  const data = listProductValidationResponses()
  return NextResponse.json({
    status: 'success',
    data,
    message: 'Product validation responses retrieved',
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<ProductValidationResponse[]>)
}
