import { existsSync, readFileSync, readdirSync } from 'fs'
import * as path from 'path'
import { registerInvariantChecker, type InvariantCheckResult } from './invariants'

interface MigrationJournal {
  entries: Array<{ idx: number; tag: string }>
}

export function checkMigrationJournalContiguity(
  repoRoot: string = process.cwd(),
): { ok: true; migrationRange: string } | { ok: false; reason: string } {
  const journalPath = path.join(repoRoot, 'db', 'migrations', 'meta', '_journal.json')
  const migrationsDir = path.join(repoRoot, 'db', 'migrations')

  if (!existsSync(journalPath)) {
    return { ok: false, reason: 'Migration journal not found at db/migrations/meta/_journal.json' }
  }

  let journal: MigrationJournal
  try {
    journal = JSON.parse(readFileSync(journalPath, 'utf8')) as MigrationJournal
  } catch {
    return { ok: false, reason: 'Migration journal is not valid JSON' }
  }

  if (!Array.isArray(journal.entries) || journal.entries.length === 0) {
    return { ok: false, reason: 'Migration journal has no entries' }
  }

  for (let expectedIdx = 0; expectedIdx < journal.entries.length; expectedIdx += 1) {
    const entry = journal.entries[expectedIdx]
    if (entry.idx !== expectedIdx) {
      return {
        ok: false,
        reason: `Migration sequence gap: expected idx ${expectedIdx}, found ${entry.idx} (${entry.tag})`,
      }
    }

    const sqlPath = path.join(migrationsDir, `${entry.tag}.sql`)
    if (!existsSync(sqlPath)) {
      return {
        ok: false,
        reason: `Migration journal entry ${entry.tag} has no matching SQL file`,
      }
    }
  }

  const sqlFiles = readdirSync(migrationsDir).filter((file) => file.endsWith('.sql'))
  const journalTags = new Set(journal.entries.map((entry) => `${entry.tag}.sql`))
  const orphanSql = sqlFiles.filter((file) => !journalTags.has(file))
  if (orphanSql.length > 0) {
    return {
      ok: false,
      reason: `SQL migration files not listed in journal: ${orphanSql.join(', ')}`,
    }
  }

  const first = journal.entries[0].tag.split('_')[0]
  const last = journal.entries[journal.entries.length - 1].tag.split('_')[0]
  return {
    ok: true,
    migrationRange: `${first}–${last} (${journal.entries.length} migrations)`,
  }
}

function drizzleMigrationsChecker(
  _phase: unknown,
  repoRoot: string,
): InvariantCheckResult {
  return checkMigrationJournalContiguity(repoRoot)
}

registerInvariantChecker('drizzle-migrations', drizzleMigrationsChecker)
