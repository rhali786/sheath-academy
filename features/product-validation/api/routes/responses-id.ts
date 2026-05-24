import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { ProductValidationResponse } from '@/features/product-validation/types'
import { requireAdminApi } from '@/features/lib/server/requireAdminApi'
import { getProductValidationResponseById } from '@/features/product-validation/server/service'

export async function GET(
  request: Request,
  id: string,
): Promise<Response> {
  const gate = await requireAdminApi(request)
  if (!gate.ok) return gate.response

  const record = await getProductValidationResponseById(id)
  if (!record) {
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

  return NextResponse.json({
    status: 'success',
    data: record,
    message: 'Product validation response retrieved',
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<ProductValidationResponse>)
}
