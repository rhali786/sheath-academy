import { createMemoryStore } from '@/features/lib/server/memoryStore'
import type { ProductValidationResponse } from '../types'

export const productValidationStore = createMemoryStore<ProductValidationResponse>([])

export function resetProductValidationStore(): void {
  productValidationStore.reset([])
}
