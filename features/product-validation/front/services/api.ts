import type { ApiResponse } from '@/features/lib/types'
import type {
  CreateProductValidationInput,
  ProductValidationResponse,
  ProductValidationSummary,
} from '@/features/product-validation/types'

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  const port = process.env.PORT || '3000'
  return `http://127.0.0.1:${port}`
}

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const body = (await res.json()) as ApiResponse<T>
  if (!res.ok) {
    const err = new Error(body.message || `Request failed: ${res.status}`) as Error & {
      status: number
      data: unknown
    }
    err.status = res.status
    err.data = body.data
    throw err
  }
  return body
}

export const productValidationApi = {
  async createResponse(
    input: CreateProductValidationInput,
  ): Promise<ProductValidationResponse> {
    const res = await fetch(`${getApiBaseUrl()}/api/product-validation/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const body = await parseResponse<ProductValidationResponse>(res)
    return body.data
  },

  async listResponses(): Promise<ProductValidationResponse[]> {
    const res = await fetch(`${getApiBaseUrl()}/api/product-validation/responses`)
    const body = await parseResponse<ProductValidationResponse[]>(res)
    return body.data
  },

  async getSummary(): Promise<ProductValidationSummary> {
    const res = await fetch(`${getApiBaseUrl()}/api/product-validation/summary`)
    const body = await parseResponse<ProductValidationSummary>(res)
    return body.data
  },
}
