/**
 * Shared helper for scripts that target production Postgres only.
 * Reads DATABASE_URL_PROD from .env.local and remaps to DATABASE_URL for getDb().
 */
export function applyProdDatabaseUrl(): string {
  const prodUrl = process.env.DATABASE_URL_PROD
  if (!prodUrl) {
    console.error('DATABASE_URL_PROD is not set in .env.local — cannot target production.')
    process.exit(1)
  }
  process.env.DATABASE_URL = prodUrl
  return prodUrl
}

export function safeDbTarget(url: string | undefined): string {
  if (!url) return '(unset)'
  try {
    const u = new URL(url)
    return `${u.hostname}:${u.port || '5432'}${u.pathname}`
  } catch {
    return '(unparseable)'
  }
}
