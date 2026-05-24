/** @jest-environment node */

/**
 * Creates minimal real DB rows (user → household → learner) for repository tests
 * that need FK-compliant parent rows.
 * Only call when DATABASE_URL is set.
 */
export async function createTestHousehold(prefix: string) {
  const { upsertUserByEmail, upsertHouseholdForUser } = await import(
    '@/features/household/server/repository'
  )
  const { createLearner } = await import('@/features/children/server/repository')
  const { getDb } = await import('@/features/lib/server/db')
  const { users, households, learners } = await import('@/db/schema')
  const { eq } = await import('drizzle-orm')

  const email = `${prefix}-${Date.now()}@test.sheath`
  const user = await upsertUserByEmail(email, 'Test User')
  const household = await upsertHouseholdForUser(user.id, 'Test Household')
  const learner = await createLearner(household.id, { name: 'Test Learner' })

  const cleanup = async () => {
    const db = getDb()
    await db.delete(learners).where(eq(learners.householdId, household.id))
    await db.delete(households).where(eq(households.id, household.id))
    await db.delete(users).where(eq(users.id, user.id))
  }

  return { user, household, learner, cleanup }
}
