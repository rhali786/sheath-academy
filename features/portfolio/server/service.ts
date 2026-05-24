// Memory store removed. Stubs kept for compilation.
// Callers (records, setup) are pending Postgres migration.
// Use portfolio/server/repository for new code.
import type { EvidenceItem, CreateEvidenceItemInput, EvidenceType } from '../types'
import type { ValidationError } from './validation'
import { and, gte, lte, sql } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { portfolioEvidence } from '@/db/schema'

export interface AdminEvidenceCount {
  householdId: string
  count: number
  lastDate: string | null
}

/** Cross-household aggregate for admin metrics. Uses portfolio_evidence_date_household_idx. */
export async function getAdminEvidenceCounts(
  periodStart: string,
  periodEnd: string,
): Promise<AdminEvidenceCount[]> {
  const db = getDb()
  const rows = await db
    .select({
      householdId: portfolioEvidence.householdId,
      count: sql<number>`count(*)::int`,
      lastDate: sql<string | null>`max(${portfolioEvidence.evidenceDate})`,
    })
    .from(portfolioEvidence)
    .where(and(gte(portfolioEvidence.evidenceDate, periodStart), lte(portfolioEvidence.evidenceDate, periodEnd)))
    .groupBy(portfolioEvidence.householdId)
  return rows
}

export function listEvidenceItems(_filters?: { childId?: string; subjectId?: string; lessonTaskId?: string; type?: EvidenceType; startDate?: string; endDate?: string }): EvidenceItem[] { return [] }
export function getEvidenceItemById(_id: string): EvidenceItem | undefined { return undefined }
export function createEvidenceItem(_data: CreateEvidenceItemInput): { item: EvidenceItem | null; errors: ValidationError[] } { return { item: null, errors: [] } }
export function updateEvidenceItem(_id: string, _data: unknown): { item: EvidenceItem | null; errors: ValidationError[] } { return { item: null, errors: [] } }
export function deleteEvidenceItem(_id: string): boolean { return false }
export function listEvidenceByChild(_childId: string): EvidenceItem[] { return [] }
export function listEvidenceBySubject(_subjectId: string, _childId?: string): EvidenceItem[] { return [] }
export function listEvidenceByLessonTask(_lessonTaskId: string): EvidenceItem[] { return [] }
export function archiveByChildId(_childId: string): void {}
export function resetEvidenceStore(_seed?: EvidenceItem[]): void {}
