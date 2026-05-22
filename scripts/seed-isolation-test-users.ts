/**
 * Seeds User A / User B with separate households for manual QA and Playwright.
 * Idempotent: stable IDs (ISOLATION_PG_SEED). Run: npm run db:seed:isolation
 */
import { ISOLATION_PG_SEED } from '../features/lib/seedIds'
import { upsertUserByEmail, upsertHouseholdForUser } from '../features/household/server/repository'
import { upsertLearner } from '../features/children/server/repository'

const USER_A_EMAIL = process.env.ISOLATION_USER_A_EMAIL ?? 'isolation-a@sheathacademy.ai'
const USER_B_EMAIL = process.env.ISOLATION_USER_B_EMAIL ?? 'isolation-b@sheathacademy.ai'

async function main() {
  const userA = await upsertUserByEmail(USER_A_EMAIL, 'Isolation User A', ISOLATION_PG_SEED.userA)
  const householdA = await upsertHouseholdForUser(
    userA.id,
    'Isolation Household A',
    ISOLATION_PG_SEED.householdA,
  )
  const learnerA = await upsertLearner(householdA.id, ISOLATION_PG_SEED.learnerA, {
    name: 'Learner A',
    gradeLevel: 'Grade 3',
  })

  const userB = await upsertUserByEmail(USER_B_EMAIL, 'Isolation User B', ISOLATION_PG_SEED.userB)
  const householdB = await upsertHouseholdForUser(
    userB.id,
    'Isolation Household B',
    ISOLATION_PG_SEED.householdB,
  )
  const learnerB = await upsertLearner(householdB.id, ISOLATION_PG_SEED.learnerB, {
    name: 'Learner B',
    gradeLevel: 'Grade 5',
  })

  console.log('Isolation seed complete:')
  console.log(`  User A: ${USER_A_EMAIL} → household ${householdA.id}, learner ${learnerA.id}`)
  console.log(`  User B: ${USER_B_EMAIL} → household ${householdB.id}, learner ${learnerB.id}`)
  console.log('Remove with: npm run db:cleanup:test')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
