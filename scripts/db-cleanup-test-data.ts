/**
 * Removes isolation test users and optionally resets the dev seed user.
 *
 *   npm run db:cleanup:test          — delete isolation-a / isolation-b only
 *   npm run db:reset:dev             — cleanup + re-seed dev (stable IDs)
 */
import { eq, inArray } from 'drizzle-orm'
import { getDb } from '../features/lib/server/db'
import { getDevSeedUserEmail } from '../features/lib/server/devUserEmail'
import { ISOLATION_PG_SEED } from '../features/lib/seedIds'
import {
  attendanceEvents,
  households,
  learners,
  lessonTasks,
  portfolioEvidence,
  quranSessions,
  schoolYears,
  subjects,
  usageEvents,
  userSettings,
  users,
} from '../db/schema'

const ISOLATION_EMAILS = [
  process.env.ISOLATION_USER_A_EMAIL ?? 'isolation-a@sheathacademy.ai',
  process.env.ISOLATION_USER_B_EMAIL ?? 'isolation-b@sheathacademy.ai',
]

async function deleteHouseholdData(householdId: string): Promise<void> {
  const db = getDb()
  await db.delete(usageEvents).where(eq(usageEvents.householdId, householdId))
  await db.delete(portfolioEvidence).where(eq(portfolioEvidence.householdId, householdId))
  await db.delete(quranSessions).where(eq(quranSessions.householdId, householdId))
  await db.delete(attendanceEvents).where(eq(attendanceEvents.householdId, householdId))
  await db.delete(lessonTasks).where(eq(lessonTasks.householdId, householdId))
  await db.delete(subjects).where(eq(subjects.householdId, householdId))
  await db.delete(schoolYears).where(eq(schoolYears.householdId, householdId))
  await db.delete(learners).where(eq(learners.householdId, householdId))
}

async function deleteUserByEmail(email: string): Promise<boolean> {
  const db = getDb()
  const found = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (found.length === 0) return false
  const user = found[0]
  const hhRows = await db.select().from(households).where(eq(households.userId, user.id))
  for (const hh of hhRows) {
    await deleteHouseholdData(hh.id)
    await db.delete(households).where(eq(households.id, hh.id))
  }
  await db.delete(userSettings).where(eq(userSettings.userId, user.id))
  await db.delete(usageEvents).where(eq(usageEvents.userId, user.id))
  await db.delete(users).where(eq(users.id, user.id))
  return true
}

async function deleteOrphanIsolationHouseholds(): Promise<void> {
  const db = getDb()
  const orphanIds = [
    ISOLATION_PG_SEED.householdA,
    ISOLATION_PG_SEED.householdB,
  ]
  for (const householdId of orphanIds) {
    const row = await db.select().from(households).where(eq(households.id, householdId)).limit(1)
    if (row.length === 0) continue
    await deleteHouseholdData(householdId)
    await db.delete(households).where(eq(households.id, householdId))
  }
  const orphanUserIds = [ISOLATION_PG_SEED.userA, ISOLATION_PG_SEED.userB]
  await db.delete(users).where(inArray(users.id, orphanUserIds))
}

async function main() {
  const resetDev = process.argv.includes('--reset-dev')

  console.log('db:cleanup — removing isolation test users…')
  for (const email of ISOLATION_EMAILS) {
    const removed = await deleteUserByEmail(email)
    console.log(removed ? `  removed ${email}` : `  (not found) ${email}`)
  }
  await deleteOrphanIsolationHouseholds()

  if (resetDev) {
    const devEmail = getDevSeedUserEmail()
    console.log(`db:cleanup — resetting dev user ${devEmail}…`)
    await deleteUserByEmail(devEmail)
  }

  console.log('db:cleanup — done')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
