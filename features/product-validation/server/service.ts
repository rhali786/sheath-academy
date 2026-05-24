import type { AuthCtx } from '@/features/auth/server/context'
import type {
  CreateProductValidationInput,
  ProductValidationResponse,
  ProductValidationSummary,
  ValidationPriceBucket,
} from '../types'
import { calculateForkTestFitScore } from './scoring'
import { validateCreateProductValidationInput } from './schema'
import { generateProductValidationResponseId } from './ids'
import {
  insertProductValidationResponse,
  listProductValidationResponseRows,
  getProductValidationResponseRow,
  buildProductValidationSummaryFromDb,
} from './repository'

export class ProductValidationValidationError extends Error {
  constructor(
    public readonly errors: { field: string; message: string }[],
  ) {
    super('Validation failed')
    this.name = 'ProductValidationValidationError'
  }
}

export async function createProductValidationResponse(
  authCtx: AuthCtx,
  input: CreateProductValidationInput,
  sessionEmail: string,
): Promise<ProductValidationResponse> {
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

  return insertProductValidationResponse(record)
}

export async function listProductValidationResponses(): Promise<ProductValidationResponse[]> {
  return listProductValidationResponseRows()
}

export async function getProductValidationResponseById(id: string): Promise<ProductValidationResponse | null> {
  return getProductValidationResponseRow(id)
}

export async function getProductValidationSummary(): Promise<ProductValidationSummary> {
  return buildProductValidationSummaryFromDb()
}
