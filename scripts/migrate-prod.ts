/**
 * Applies pending Drizzle migrations to PRODUCTION.
 *
 *   npm run db:migrate:prod
 *
 * Reads DATABASE_URL_PROD from .env.local (loaded by the npm script via
 * dotenv-cli), remaps it to DATABASE_URL for drizzle-kit, then runs the same
 * `drizzle-kit migrate` used for dev. Migrations are additive; this never wipes.
 */
import { execSync } from 'node:child_process'

const prodUrl = process.env.DATABASE_URL_PROD
if (!prodUrl) {
  console.error('DATABASE_URL_PROD is not set in .env.local — cannot migrate prod.')
  process.exit(1)
}

process.env.DATABASE_URL = prodUrl

try {
  const host = new URL(prodUrl).hostname
  console.log(`db:migrate:prod — applying migrations to PRODUCTION (${host})…`)
} catch {
  console.log('db:migrate:prod — applying migrations to PRODUCTION…')
}

execSync('npx drizzle-kit migrate', { stdio: 'inherit', env: process.env })
