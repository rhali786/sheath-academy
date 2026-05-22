/** @jest-environment node */

/**
 * Learner repository tests.
 * Require a real Postgres connection; skipped automatically when DATABASE_URL is not set.
 */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import {
  createLearner,
  listLearners,
  getLearner,
  updateLearner,
  archiveLearner,
  restoreLearner,
} from '../../server/repository'
import { upsertUserByEmail, upsertHouseholdForUser } from '@/features/household/server/repository'

const TS = Date.now()
const testEmail = `learner-repo-test-${TS}@sheath.test`

let testHouseholdId = ''
let learnerId = ''

beforeAll(async () => {
  if (!hasDb) return
  const user = await upsertUserByEmail(testEmail)
  const household = await upsertHouseholdForUser(user.id, 'Learner Test Household')
  testHouseholdId = household.id
})

afterAll(async () => {
  if (!hasDb) return
  const { getDb } = await import('@/features/lib/server/db')
  const { learners, households, users } = await import('@/db/schema')
  const { eq } = await import('drizzle-orm')
  const db = getDb()
  await db.delete(learners).where(eq(learners.householdId, testHouseholdId))
  await db.delete(households).where(eq(households.id, testHouseholdId))
  const user = await db.select().from(users).where(eq(users.email, testEmail)).limit(1)
  if (user[0]) await db.delete(users).where(eq(users.id, user[0].id))
})

describe('learner repository', () => {
  itDb('createLearner inserts a new row', async () => {
    const learner = await createLearner(testHouseholdId, {
      name: 'Repo Learner',
      gradeLevel: 'Grade 4',
    })
    learnerId = learner.id
    expect(learner.id).toBeTruthy()
    expect(learner.householdId).toBe(testHouseholdId)
    expect(learner.name).toBe('Repo Learner')
    expect(learner.isActive).toBe(true)
  })

  itDb('listLearners returns only active learners for the household', async () => {
    const list = await listLearners(testHouseholdId)
    expect(list.length).toBeGreaterThan(0)
    expect(list.every(l => l.isActive)).toBe(true)
    expect(list.every(l => l.householdId === testHouseholdId)).toBe(true)
  })

  itDb('getLearner returns the learner for the correct household', async () => {
    const learner = await getLearner(learnerId, testHouseholdId)
    expect(learner).not.toBeNull()
    expect(learner!.id).toBe(learnerId)
  })

  itDb('getLearner returns null for a wrong householdId (tenant scoping)', async () => {
    const learner = await getLearner(learnerId, 'other-household-xyz')
    expect(learner).toBeNull()
  })

  itDb('updateLearner changes the name', async () => {
    const updated = await updateLearner(learnerId, testHouseholdId, { name: 'Updated Learner' })
    expect(updated).not.toBeNull()
    expect(updated!.name).toBe('Updated Learner')
  })

  itDb('archiveLearner sets isActive = false', async () => {
    const archived = await archiveLearner(learnerId, testHouseholdId)
    expect(archived).not.toBeNull()
    expect(archived!.isActive).toBe(false)
  })

  itDb('archived learner is excluded from listLearners', async () => {
    const list = await listLearners(testHouseholdId)
    expect(list.find(l => l.id === learnerId)).toBeUndefined()
  })

  itDb('restoreLearner sets isActive = true', async () => {
    const restored = await restoreLearner(learnerId, testHouseholdId)
    expect(restored).not.toBeNull()
    expect(restored!.isActive).toBe(true)
  })
})
