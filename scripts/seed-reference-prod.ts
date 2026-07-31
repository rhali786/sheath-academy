/**
 * Seeds reference data (compliance_rulesets + starter badge_definitions) into PRODUCTION.
 *
 *   npm run db:seed:reference:prod
 *
 * Reads DATABASE_URL_PROD from .env.local (loaded by the npm script via dotenv-cli),
 * remaps it to DATABASE_URL, then runs the same insert-only `seed-reference-data.ts`
 * used for dev. The seed uses ON CONFLICT DO NOTHING and never truncates — re-runs are
 * a no-op. This never deletes or overwrites existing rows.
 */
import { execSync } from 'node:child_process'
import * as path from 'node:path'

const prodUrl = process.env.DATABASE_URL_PROD
if (!prodUrl) {
  console.error('DATABASE_URL_PROD is not set in .env.local — cannot seed prod.')
  process.exit(1)
}

process.env.DATABASE_URL = prodUrl

try {
  const host = new URL(prodUrl).hostname
  console.log(`db:seed:reference:prod — seeding reference data into PRODUCTION (${host})…`)
} catch {
  console.log('db:seed:reference:prod — seeding reference data into PRODUCTION…')
}

const seedScript = path.join(__dirname, 'seed-reference-data.ts')
execSync(`npx tsx "${seedScript}"`, { stdio: 'inherit', env: process.env })
