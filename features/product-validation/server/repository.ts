import { desc, eq, sql } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { productValidationResponses } from '@/db/schema'
import type { ProductValidationResponse, ProductValidationSummary, ValidationPriceBucket } from '../types'

type ResponseRow = typeof productValidationResponses.$inferSelect

/** Debug: compare live Postgres columns vs Drizzle schema expectations. */
async function logProductValidationDbDiagnostics(hypothesisId: string, operation: string): Promise<void> {
  const db = getDb()
  const columns = await db.execute<{ column_name: string }>(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_validation_responses'
    ORDER BY ordinal_position
  `)
  const columnNames = (columns as { column_name: string }[]).map((r) => r.column_name)
  let appliedMigrations: { id: number; hash: string; created_at: string }[] = []
  try {
    const migrations = await db.execute(sql`
      SELECT id, hash, created_at::text
      FROM drizzle.__drizzle_migrations
      ORDER BY created_at DESC
      LIMIT 5
    `)
    appliedMigrations = migrations as unknown as typeof appliedMigrations
  } catch {
    try {
      const migrations = await db.execute(sql`
        SELECT id, hash, created_at::text
        FROM __drizzle_migrations
        ORDER BY created_at DESC
        LIMIT 5
      `)
      appliedMigrations = migrations as unknown as typeof appliedMigrations
    } catch {
      appliedMigrations = []
    }
  }
  // #region agent log
  fetch('http://127.0.0.1:7867/ingest/ba82b305-ec67-4264-aab8-83a8635a4484', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cfa7a5' },
    body: JSON.stringify({
      sessionId: 'cfa7a5',
      runId: 'pre-fix',
      hypothesisId,
      location: 'repository.ts:logProductValidationDbDiagnostics',
      message: 'product_validation_responses DB diagnostics',
      data: {
        operation,
        hasHouseholdIdColumn: columnNames.includes('household_id'),
        columnNames,
        appliedMigrations,
        expectsMigration0003: '0003_dear_quentin_quire',
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
}

function rowToResponse(r: ResponseRow): ProductValidationResponse {
  return {
    id: r.id,
    userId: r.userId ?? '',
    householdId: r.householdId ?? undefined,
    respondentName: r.respondentName ?? undefined,
    respondentEmail: r.respondentEmail,
    respondentType: r.respondentType as ProductValidationResponse['respondentType'],
    householdOrProgramType: r.householdOrProgramType ?? undefined,
    usageDuration: r.usageDuration as ProductValidationResponse['usageDuration'],
    usedFeatureAreas: (r.usedFeatureAreas ?? []) as ProductValidationResponse['usedFeatureAreas'],
    previousPainScore: r.previousPainScore,
    improvementScore: r.improvementScore,
    easeScore: r.easeScore,
    trustScore: r.trustScore,
    retentionScore: r.retentionScore,
    payScore: r.payScore,
    referralScore: r.referralScore,
    positioningClarityScore: r.positioningClarityScore,
    reasonableMonthlyPriceBucket: r.reasonableMonthlyPriceBucket as ValidationPriceBucket,
    pricingNotes: r.pricingNotes ?? undefined,
    replacedWhat: r.replacedWhat,
    mostUseful: r.mostUseful,
    confusingOrBurdensome: r.confusingOrBurdensome,
    mustHaveChange: r.mustHaveChange,
    lostAccessReaction: r.lostAccessReaction,
    recommendTo: r.recommendTo,
    referralMessage: r.referralMessage,
    additionalNotes: r.additionalNotes ?? undefined,
    mayContact: r.mayContact,
    mayQuoteAnonymized: r.mayQuoteAnonymized,
    mayQuoteWithName: r.mayQuoteWithName,
    forkTestFitScore: Number(r.forkTestFitScore),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export async function insertProductValidationResponse(
  data: ProductValidationResponse,
): Promise<ProductValidationResponse> {
  await logProductValidationDbDiagnostics('H1', 'insert')
  const db = getDb()
  const now = new Date()
  const [row] = await db
    .insert(productValidationResponses)
    .values({
      id: data.id,
      userId: data.userId || null,
      householdId: data.householdId ?? null,
      tenantId: data.householdId ?? null,
      respondentName: data.respondentName ?? null,
      respondentEmail: data.respondentEmail,
      respondentType: data.respondentType,
      householdOrProgramType: data.householdOrProgramType ?? null,
      usageDuration: data.usageDuration,
      usedFeatureAreas: data.usedFeatureAreas,
      previousPainScore: data.previousPainScore,
      improvementScore: data.improvementScore,
      easeScore: data.easeScore,
      trustScore: data.trustScore,
      retentionScore: data.retentionScore,
      payScore: data.payScore,
      referralScore: data.referralScore,
      positioningClarityScore: data.positioningClarityScore,
      reasonableMonthlyPriceBucket: data.reasonableMonthlyPriceBucket,
      pricingNotes: data.pricingNotes ?? null,
      replacedWhat: data.replacedWhat,
      mostUseful: data.mostUseful,
      confusingOrBurdensome: data.confusingOrBurdensome,
      mustHaveChange: data.mustHaveChange,
      lostAccessReaction: data.lostAccessReaction,
      recommendTo: data.recommendTo,
      referralMessage: data.referralMessage,
      additionalNotes: data.additionalNotes ?? null,
      mayContact: data.mayContact,
      mayQuoteAnonymized: data.mayQuoteAnonymized,
      mayQuoteWithName: data.mayQuoteWithName,
      forkTestFitScore: String(data.forkTestFitScore),
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return rowToResponse(row)
}

export async function listProductValidationResponseRows(): Promise<ProductValidationResponse[]> {
  await logProductValidationDbDiagnostics('H1', 'list')
  const db = getDb()
  const rows = await db
    .select()
    .from(productValidationResponses)
    .orderBy(desc(productValidationResponses.createdAt))
  return rows.map(rowToResponse)
}

export async function getProductValidationResponseRow(id: string): Promise<ProductValidationResponse | null> {
  const db = getDb()
  const rows = await db
    .select()
    .from(productValidationResponses)
    .where(eq(productValidationResponses.id, id))
    .limit(1)
  return rows[0] ? rowToResponse(rows[0]) : null
}

export async function buildProductValidationSummaryFromDb(): Promise<ProductValidationSummary> {
  const rows = await listProductValidationResponseRows()
  if (!rows.length) {
    return {
      totalResponses: 0,
      averageForkTestFitScore: null,
      averagePreviousPainScore: null,
      averageImprovementScore: null,
      averageEaseScore: null,
      averageTrustScore: null,
      averageRetentionScore: null,
      averagePayScore: null,
      averageReferralScore: null,
      averagePositioningClarityScore: null,
      priceBucketCounts: {} as ProductValidationSummary['priceBucketCounts'],
      mayContactCount: 0,
      mayQuoteAnonymizedCount: 0,
      mayQuoteWithNameCount: 0,
    }
  }
  const avg = (field: keyof ProductValidationResponse) =>
    rows.reduce((s, r) => s + (r[field] as number), 0) / rows.length

  const buckets: Record<string, number> = {}
  for (const r of rows) buckets[r.reasonableMonthlyPriceBucket] = (buckets[r.reasonableMonthlyPriceBucket] ?? 0) + 1

  return {
    totalResponses: rows.length,
    averageForkTestFitScore: avg('forkTestFitScore'),
    averagePreviousPainScore: avg('previousPainScore'),
    averageImprovementScore: avg('improvementScore'),
    averageEaseScore: avg('easeScore'),
    averageTrustScore: avg('trustScore'),
    averageRetentionScore: avg('retentionScore'),
    averagePayScore: avg('payScore'),
    averageReferralScore: avg('referralScore'),
    averagePositioningClarityScore: avg('positioningClarityScore'),
    priceBucketCounts: buckets as ProductValidationSummary['priceBucketCounts'],
    mayContactCount: rows.filter(r => r.mayContact).length,
    mayQuoteAnonymizedCount: rows.filter(r => r.mayQuoteAnonymized).length,
    mayQuoteWithNameCount: rows.filter(r => r.mayQuoteWithName).length,
  }
}
