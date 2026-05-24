/**
 * App-wide admin gate (metrics, product validation).
 * Set ADMIN_EMAIL in .env.local (e.g. dev@sheathacademy.ai for dev bypass user).
 * PRODUCT_VALIDATION_ADMIN_EMAIL is a deprecated alias.
 */
export function isAppAdmin(email: string | null | undefined): boolean {
  const adminEmail =
    process.env.ADMIN_EMAIL?.trim() ||
    process.env.PRODUCT_VALIDATION_ADMIN_EMAIL?.trim()
  if (!adminEmail) return false
  if (!email?.trim()) return false
  return email.trim().toLowerCase() === adminEmail.toLowerCase()
}
