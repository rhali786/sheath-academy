import type { AuthCtx } from '@/features/auth/server/context'
import type {
  CreateProductValidationInput,
  ProductValidationResponse,
  ProductValidationSummary,
} from '../types'
import { calculateForkTestFitScore, buildProductValidationSummary } from './scoring'
import { validateCreateProductValidationInput } from './schema'
import { generateProductValidationResponseId } from './ids'
import { productValidationStore } from './store'

export class ProductValidationValidationError extends Error {
  constructor(
    public readonly errors: { field: string; message: string }[],
  ) {
    super('Validation failed')
    this.name = 'ProductValidationValidationError'
  }
}

export function createProductValidationResponse(
  authCtx: AuthCtx,
  input: CreateProductValidationInput,
  sessionEmail: string,
): ProductValidationResponse {
  const errors = validateCreateProductValidationInput(input)
  if (errors.length > 0) {
    throw new ProductValidationValidationError(errors)
  }

  const now = new Date().toISOString()
  const forkTestFitScore = calculateForkTestFitScore(input)

  const record: ProductValidationResponse = {
    ...input,
    id: generateProductValidationResponseId(),
    userId: authCtx.userId,
    householdId: authCtx.householdId || undefined,
    respondentEmail: sessionEmail.trim() || input.respondentEmail.trim(),
    respondentName: input.respondentName?.trim() || undefined,
    householdOrProgramType: input.householdOrProgramType?.trim() || undefined,
    pricingNotes: input.pricingNotes?.trim() || undefined,
    additionalNotes: input.additionalNotes?.trim() || undefined,
    forkTestFitScore,
    createdAt: now,
    updatedAt: now,
  }

  productValidationStore.insert(record)
  return record
}

export function listProductValidationResponses(): ProductValidationResponse[] {
  return [...productValidationStore.getAll()].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt),
  )
}

export function getProductValidationResponseById(
  id: string,
): ProductValidationResponse | null {
  return productValidationStore.getById(id) ?? null
}

export function getProductValidationSummary(): ProductValidationSummary {
  return buildProductValidationSummary(productValidationStore.getAll())
}
