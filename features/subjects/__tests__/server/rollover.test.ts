/** @jest-environment node */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import { createSubjectRow, getSubjectRow, archiveSubjectRow } from '../../server/repository'
import { rolloverCourses } from '../../server/rollover'
import { createSchoolYearRow } from '@/features/school-year/server/repository'
import { createLearner } from '@/features/children/server/repository'
import { createTestHousehold } from '@/features/lib/__tests__/fixtures/testDb'

let householdId: string
let learnerId: string
let learner2Id: string
let fromYearId: string
let toYearId: string
let cleanup: () => Promise<void>

beforeAll(async () => {
  if (!hasDb) return
  const fixtures = await createTestHousehold('subjects-rollover')
  householdId = fixtures.household.id
  learnerId = fixtures.learner.id
  const l2 = await createLearner(householdId, { name: 'Second Learner' })
  learner2Id = l2.id

  const fromYear = await createSchoolYearRow(householdId, {
    name: '2024-2025',
    startDate: '2024-08-01',
    endDate: '2025-06-30',
    isActive: true,
  })
  fromYearId = fromYear.id

  const toYear = await createSchoolYearRow(householdId, {
    name: '2025-2026',
    startDate: '2025-08-01',
    endDate: '2026-06-30',
    isActive: false,
  })
  toYearId = toYear.id

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

describe('rolloverCourses', () => {
  itDb('clones selected courses with enrollments; source rows untouched', async () => {
    const source = await createSubjectRow(householdId, {
      name: 'Shared Science',
      category: 'Science',
      learnerIds: [learnerId, learner2Id],
      schoolYearId: fromYearId,
    })

    const other = await createSubjectRow(householdId, {
      name: 'Other Course',
      category: 'Math',
      learnerId,
      schoolYearId: fromYearId,
    })

    const created = await rolloverCourses(householdId, fromYearId, toYearId, [source.id])

    expect(created).toHaveLength(1)
    expect(created[0].id).not.toBe(source.id)
    expect(created[0].schoolYearId).toBe(toYearId)
    expect(created[0].name).toBe('Shared Science')
    expect(created[0].learnerIds.sort()).toEqual([learnerId, learner2Id].sort())

    const sourceAfter = await getSubjectRow(source.id, householdId)
    expect(sourceAfter?.schoolYearId).toBe(fromYearId)
    expect(sourceAfter?.name).toBe('Shared Science')

    const otherAfter = await getSubjectRow(other.id, householdId)
    expect(otherAfter?.schoolYearId).toBe(fromYearId)
  })

  itDb('courseIds omitted clones all active courses in source year; skips inactive', async () => {
    const active = await createSubjectRow(householdId, {
      name: 'Active Clone',
      category: 'Reading',
      learnerId,
      schoolYearId: fromYearId,
    })

    const inactive = await createSubjectRow(householdId, {
      name: 'Archived Clone',
      category: 'Writing',
      learnerId,
      schoolYearId: fromYearId,
    })
    await archiveSubjectRow(inactive.id, householdId)

    const created = await rolloverCourses(householdId, fromYearId, toYearId)

    const names = created.map((r) => r.name)
    expect(names).toContain('Active Clone')
    expect(names).not.toContain('Archived Clone')

    const activeAfter = await getSubjectRow(active.id, householdId)
    expect(activeAfter?.schoolYearId).toBe(fromYearId)
  })
})
