import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

let _db: DrizzleDb | undefined
let _client: ReturnType<typeof postgres> | undefined

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
    _client = postgres(url)
    _db = drizzle(_client, { schema })
  }
  return _db
}

/**
 * Closes the shared Postgres connection and resets the memoized instance.
 * Intended for test teardown (afterAll) and one-off scripts so the process can
 * exit cleanly — production never calls this. No-op if no connection was opened.
 */
export async function closeDb(): Promise<void> {
  if (_client) {
    await _client.end({ timeout: 5 })
    _client = undefined
    _db = undefined
  }
}
