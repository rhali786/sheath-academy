import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { ProductValidationSummary } from '@/features/product-validation/types'
import { requireAdminApi } from '@/features/lib/server/requireAdminApi'
import { getProductValidationSummary } from '@/features/product-validation/server/service'

export async function GET(request: Request): Promise<Response> {
  const gate = await requireAdminApi(request)
  if (!gate.ok) return gate.response

  const data = await getProductValidationSummary()
  return NextResponse.json({
    status: 'success',
    data,
    message: 'Product validation summary retrieved',
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<ProductValidationSummary>)
}
