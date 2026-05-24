/** Default dev bypass + seed user email when DEV_SEED_USER_EMAIL is unset. */
export const DEFAULT_DEV_SEED_USER_EMAIL = 'dev@sheathacademy.ai'

/**
 * Email used by dev bypass sign-in and `npm run db:seed:demo` (Household A).
 * Set DEV_SEED_USER_EMAIL in .env.local so both paths stay aligned.
 */
export function getDevSeedUserEmail(): string {
  return process.env.DEV_SEED_USER_EMAIL ?? DEFAULT_DEV_SEED_USER_EMAIL
}
