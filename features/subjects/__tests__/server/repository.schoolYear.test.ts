/** @jest-environment node */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import {
  createSubjectRow,
  getSubjectRow,
  listSubjectRows,
} from '../../server/repository'
import { createSchoolYearRow } from '@/features/school-year/server/repository'
import { createTestHousehold } from '@/features/lib/__tests__/fixtures/testDb'

let householdId: string
let learnerId: string
let activeYearId: string
let cleanup: () => Promise<void>

/** Same statement appended to the phase-1 migration backfill. */
const BACKFILL_SQL = `
UPDATE subjects SET school_year_id = (
  SELECT sy.id FROM school_years sy
  WHERE sy.household_id = subjects.household_id AND sy.is_active = true LIMIT 1
) WHERE school_year_id IS NULL;
`

beforeAll(async () => {
  if (!hasDb) return
  const fixtures = await createTestHousehold('subjects-school-year')
  householdId = fixtures.household.id
  learnerId = fixtures.learner.id

  const activeYear = await createSchoolYearRow(householdId, {
    name: '2025-2026',
    startDate: '2025-08-01',
    endDate: '2026-06-30',
    isActive: true,
  })
  activeYearId = activeYear.id

  cleanup = async () => {
    const { getDb } = await import('@/features/lib/server/db')
    const { subjects, subjectLearners, schoolYears } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = getDb()
    const subjectRows = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(eq(subjects.householdId, householdId))
    for (const s of subjectRows) {
      await db.delete(subjectLearners).where(eq(subjectLearners.subjectId, s.id))
    }
    await db.delete(subjects).where(eq(subjects.householdId, householdId))
    await db.delete(schoolYears).where(eq(schoolYears.householdId, householdId))
    await fixtures.cleanup()
  }
})

afterAll(async () => {
  if (hasDb) await cleanup?.()
})

describe('subjects repository — schoolYearId', () => {
  itDb('createSubjectRow with schoolYearId persists and round-trips via getSubjectRow and listSubjectRows', async () => {
    const row = await createSubjectRow(householdId, {
      name: 'Year-Scoped Math',
      category: 'Math',
      learnerId,
      schoolYearId: activeYearId,
    })

    expect(row.schoolYearId).toBe(activeYearId)

    const fetched = await getSubjectRow(row.id, householdId)
    expect(fetched?.schoolYearId).toBe(activeYearId)

    const listed = await listSubjectRows(householdId)
    const match = listed.find((r) => r.id === row.id)
    expect(match?.schoolYearId).toBe(activeYearId)
  })

  itDb('backfill sets NULL school_year_id rows to the household active year', async () => {
    const { getDb } = await import('@/features/lib/server/db')
    const { subjects } = await import('@/db/schema')
    const db = getDb()
    const now = new Date()

    const [legacyA] = await db
      .insert(subjects)
      .values({
        id: `subject_legacy_a_${Date.now()}`,
        householdId,
        learnerId,
        name: 'Legacy Course A',
        category: 'Science',
        sortOrder: 0,
        isActive: true,
        schoolYearId: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    const [legacyB] = await db
      .insert(subjects)
      .values({
        id: `subject_legacy_b_${Date.now() + 1}`,
        householdId,
        learnerId,
        name: 'Legacy Course B',
        category: 'History',
        sortOrder: 1,
        isActive: true,
        schoolYearId: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    expect(legacyA.schoolYearId).toBeNull()
    expect(legacyB.schoolYearId).toBeNull()

    await db.execute(BACKFILL_SQL)

    const refetchedA = await getSubjectRow(legacyA.id, householdId)
    const refetchedB = await getSubjectRow(legacyB.id, householdId)
    expect(refetchedA?.schoolYearId).toBe(activeYearId)
    expect(refetchedB?.schoolYearId).toBe(activeYearId)
  })

  itDb('listSubjectRows with schoolYearId returns matching year and NULL rows, excludes other years', async () => {
    const otherYear = await createSchoolYearRow(householdId, {
      name: '2024-2025',
      startDate: '2024-08-01',
      endDate: '2025-06-30',
      isActive: false,
    })

    const activeCourse = await createSubjectRow(householdId, {
      name: 'Active Year Course',
      category: 'Math',
      learnerId,
      schoolYearId: activeYearId,
    })

    const otherYearCourse = await createSubjectRow(householdId, {
      name: 'Old Year Course',
      category: 'Science',
      learnerId,
      schoolYearId: otherYear.id,
    })

    const { getDb } = await import('@/features/lib/server/db')
    const { subjects } = await import('@/db/schema')
    const db = getDb()
    const now = new Date()
    const [nullYearCourse] = await db
      .insert(subjects)
      .values({
        id: `subject_null_year_${Date.now()}`,
        householdId,
        learnerId,
        name: 'Null Year Course',
        category: 'History',
        sortOrder: 0,
        isActive: true,
        schoolYearId: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    const filtered = await listSubjectRows(householdId, undefined, false, {
      schoolYearId: activeYearId,
    })
    const ids = filtered.map((r) => r.id)

    expect(ids).toContain(activeCourse.id)
    expect(ids).toContain(nullYearCourse.id)
    expect(ids).not.toContain(otherYearCourse.id)
  })

  itDb('createSubjectRow with explicit schoolYearId from caller persists active year id', async () => {
    const row = await createSubjectRow(householdId, {
      name: 'Default Year Course',
      category: 'EnglishELA',
      learnerId,
      schoolYearId: activeYearId,
    })
    expect(row.schoolYearId).toBe(activeYearId)
  })
})
