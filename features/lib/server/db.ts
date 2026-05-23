import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

let _db: DrizzleDb | undefined

/**
 * Returns the shared Drizzle db instance (lazy — created on first call).
 * Throws if DATABASE_URL is not set. Do not call in test code that lacks a
 * real Postgres connection; those tests should mock at the repository level.
 */
export function getDb(): DrizzleDb {
  if (!_db) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error(
        'DATABASE_URL is not configured. ' +
          'Add it in Render → Environment or .env.local (see .env.example).',
      )
    }
    const client = postgres(url)
    _db = drizzle(client, { schema })
  }
  return _db
}
