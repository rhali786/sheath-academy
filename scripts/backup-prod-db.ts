/**
 * READ-ONLY full export of production data via Drizzle ORM.
 *
 *   npm run db:backup:prod
 *
 * Uses DATABASE_URL_PROD from .env.local. Writes to backups/prod-<timestamp>/.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { sql } from 'drizzle-orm'
import { getDb, closeDb } from '@/features/lib/server/db'
import { applyProdDatabaseUrl, safeDbTarget } from './lib/prod-env'
import { SCHEMA_TABLES } from './lib/schema-tables'
import { serializeRows } from './lib/serialize-rows'

type MigrationRow = { id: number; hash: string; created_at: string }

function timestampSlug(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

async function exportDrizzleMigrations(
  db: ReturnType<typeof getDb>,
  outDir: string,
): Promise<MigrationRow[]> {
  try {
    const rows = (await db.execute(
      sql`SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`,
    )) as unknown as MigrationRow[]
    writeFileSync(join(outDir, 'drizzle_migrations.json'), serializeRows(rows), 'utf8')
    return rows
  } catch (err) {
    writeFileSync(
      join(outDir, 'drizzle_migrations.json'),
      JSON.stringify({ error: (err as Error).message }, null, 2),
      'utf8',
    )
    return []
  }
}

async function main() {
  const prodUrl = applyProdDatabaseUrl()
  const target = safeDbTarget(prodUrl)
  const root = join(process.cwd(), 'backups', `prod-${timestampSlug()}`)
  const tablesDir = join(root, 'tables')
  mkdirSync(tablesDir, { recursive: true })

  console.log(`db:backup:prod — exporting PRODUCTION (${target}) via Drizzle…`)
  console.log(`Output: ${root}`)

  const db = getDb()
  const tableCounts: Record<string, number> = {}

  for (const { name, table } of SCHEMA_TABLES) {
    process.stdout.write(`  ${name}… `)
    try {
      const rows = await db.select().from(table)
      writeFileSync(join(tablesDir, `${name}.json`), serializeRows(rows), 'utf8')
      tableCounts[name] = rows.length
      console.log(`${rows.length} rows`)
    } catch (err) {
      tableCounts[name] = -1
      console.log(`ERROR: ${(err as Error).message}`)
    }
  }

  const migrations = await exportDrizzleMigrations(db, root)

  const manifest = {
    exportedAt: new Date().toISOString(),
    target,
    exporter: 'drizzle-orm',
    tableCount: SCHEMA_TABLES.length,
    rowCounts: tableCounts,
    appliedMigrations: migrations.length,
    outputDir: root,
  }
  writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')

  console.log(
    `\nDone — ${SCHEMA_TABLES.length} schema tables, ${migrations.length} applied migrations recorded.`,
  )
  console.log(`Manifest: ${join(root, 'manifest.json')}`)

  await closeDb()
}

main().catch(async err => {
  console.error(err)
  await closeDb()
  process.exit(1)
})
