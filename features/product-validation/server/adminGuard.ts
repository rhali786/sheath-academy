import { isAppAdmin } from '@/features/lib/server/appAdmin'

/** @deprecated Use isAppAdmin — kept for product-validation imports. */
export function isProductValidationAdmin(email: string | null | undefined): boolean {
  return isAppAdmin(email)
}