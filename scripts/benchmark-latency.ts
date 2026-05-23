/**
 * Latency benchmark: in-memory store vs raw Postgres vs Drizzle ORM.
 * Run: npx dotenv -e .env.local -- npx tsx scripts/benchmark-latency.ts
 */
import { performance } from 'node:perf_hooks'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import { pgTable, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
function createMemoryStore<T extends { id: string }>(seed: T[]) {
  let items: T[] = JSON.parse(JSON.stringify(seed))
  return {
    getAll: () => items,
    getById: (id: string) => items.find(i => i.id === id),
    insert: (item: T) => { items.push(item); return item },
    update: (id: string, patch: Partial<T>) => {
      const i = items.findIndex(x => x.id === id)
      if (i === -1) return null
      items[i] = { ...items[i], ...patch }
      return items[i]
    },
    remove: (id: string) => {
      const before = items.length
      items = items.filter(x => x.id !== id)
      return items.length < before
    },
    reset: (newSeed: T[]) => { items = JSON.parse(JSON.stringify(newSeed)) },
  }
}

const ITERATIONS = 200
const WARMUP = 20

type BenchRow = { id: string; payload: Record<string, string>; createdAt: Date }

const benchmarkTable = pgTable('_latency_benchmark', {
  id: text('id').primaryKey(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at').notNull(),
})

function makeRow(suffix: string): BenchRow {
  return {
    id: `bench-${suffix}`,
    payload: { label: 'latency-test', suffix, note: 'benchmark payload' },
    createdAt: new Date(),
  }
}

function avgMs(samples: number[]): number {
  return samples.reduce((a, b) => a + b, 0) / samples.length
}

function p95Ms(samples: number[]): number {
  const sorted = [...samples].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1]!
}

async function benchMemory() {
  const store = createMemoryStore<BenchRow & { id: string }>([])
  const writeSamples: number[] = []
  const readSamples: number[] = []

  for (let i = 0; i < WARMUP + ITERATIONS; i++) {
    const row = makeRow(String(i))
    const t0 = performance.now()
    store.insert(row)
    const writeMs = performance.now() - t0

    const t1 = performance.now()
    store.getById(row.id)
    const readMs = performance.now() - t1

    if (i >= WARMUP) {
      writeSamples.push(writeMs)
      readSamples.push(readMs)
    }
  }

  return {
    writeAvgMs: avgMs(writeSamples),
    writeP95Ms: p95Ms(writeSamples),
    readAvgMs: avgMs(readSamples),
    readP95Ms: p95Ms(readSamples),
  }
}

async function benchRawPostgres(sql: postgres.Sql) {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS _latency_benchmark (
      id text PRIMARY KEY,
      payload jsonb NOT NULL,
      created_at timestamptz NOT NULL
    )
  `)

  const writeSamples: number[] = []
  const readSamples: number[] = []

  for (let i = 0; i < WARMUP + ITERATIONS; i++) {
    const row = makeRow(`pg-${i}`)
    await sql`DELETE FROM _latency_benchmark WHERE id = ${row.id}`

    const t0 = performance.now()
    await sql`
      INSERT INTO _latency_benchmark (id, payload, created_at)
      VALUES (${row.id}, ${JSON.stringify(row.payload)}, ${row.createdAt.toISOString()})
    `
    const writeMs = performance.now() - t0

    const t1 = performance.now()
    await sql`
      SELECT id, payload, created_at
      FROM _latency_benchmark
      WHERE id = ${row.id}
    `
    const readMs = performance.now() - t1

    if (i >= WARMUP) {
      writeSamples.push(writeMs)
      readSamples.push(readMs)
    }
  }

  return {
    writeAvgMs: avgMs(writeSamples),
    writeP95Ms: p95Ms(writeSamples),
    readAvgMs: avgMs(readSamples),
    readP95Ms: p95Ms(readSamples),
  }
}

async function benchDrizzle(db: ReturnType<typeof drizzle>) {
  const writeSamples: number[] = []
  const readSamples: number[] = []

  for (let i = 0; i < WARMUP + ITERATIONS; i++) {
    const row = makeRow(`dz-${i}`)
    await db.delete(benchmarkTable).where(eq(benchmarkTable.id, row.id))

    const t0 = performance.now()
    await db.insert(benchmarkTable).values({
      id: row.id,
      payload: row.payload,
      createdAt: row.createdAt,
    })
    const writeMs = performance.now() - t0

    const t1 = performance.now()
    await db.select().from(benchmarkTable).where(eq(benchmarkTable.id, row.id))
    const readMs = performance.now() - t1

    if (i >= WARMUP) {
      writeSamples.push(writeMs)
      readSamples.push(readMs)
    }
  }

  return {
    writeAvgMs: avgMs(writeSamples),
    writeP95Ms: p95Ms(writeSamples),
    readAvgMs: avgMs(readSamples),
    readP95Ms: p95Ms(readSamples),
  }
}

function printResult(label: string, r: Awaited<ReturnType<typeof benchMemory>>) {
  console.log(`\n${label}`)
  console.log(`  write  avg ${r.writeAvgMs.toFixed(3)} ms  |  p95 ${r.writeP95Ms.toFixed(3)} ms`)
  console.log(`  read   avg ${r.readAvgMs.toFixed(3)} ms  |  p95 ${r.readP95Ms.toFixed(3)} ms`)
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  console.log(`Latency benchmark (${ITERATIONS} measured iterations after ${WARMUP} warmup)`)
  console.log(`Single-row insert + select-by-id per iteration`)

  const memory = await benchMemory()
  printResult('In-memory (createMemoryStore)', memory)

  const sql = postgres(url, { max: 1 })
  const db = drizzle(sql)

  try {
  // connection warmup
  await sql`SELECT 1`

  const rawPg = await benchRawPostgres(sql)
  printResult('Raw Postgres (postgres.js)', rawPg)

  const drizzleResult = await benchDrizzle(db)
  printResult('Drizzle ORM (insert + select)', drizzleResult)

  console.log('\n--- ratio vs in-memory (avg) ---')
  console.log(`  Raw Postgres write: ${(rawPg.writeAvgMs / memory.writeAvgMs).toFixed(1)}x`)
  console.log(`  Raw Postgres read:  ${(rawPg.readAvgMs / memory.readAvgMs).toFixed(1)}x`)
  console.log(`  Drizzle write:      ${(drizzleResult.writeAvgMs / memory.writeAvgMs).toFixed(1)}x`)
  console.log(`  Drizzle read:       ${(drizzleResult.readAvgMs / memory.readAvgMs).toFixed(1)}x`)
  console.log(`  Drizzle vs raw write: ${(drizzleResult.writeAvgMs / rawPg.writeAvgMs).toFixed(2)}x`)
  console.log(`  Drizzle vs raw read:  ${(drizzleResult.readAvgMs / rawPg.readAvgMs).toFixed(2)}x`)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
