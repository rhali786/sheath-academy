/**
 * Seeds User A / User B with separate households for manual QA and Playwright.
 * Run: npx dotenv -e .env.local -- tsx scripts/seed-isolation-test-users.ts
 */
import { upsertUserByEmail, upsertHouseholdForUser } from '../features/household/server/repository'
import { createLearner } from '../features/children/server/repository'

const USER_A_EMAIL = process.env.ISOLATION_USER_A_EMAIL ?? 'isolation-a@sheathacademy.ai'
const USER_B_EMAIL = process.env.ISOLATION_USER_B_EMAIL ?? 'isolation-b@sheathacademy.ai'

async function main() {
  const userA = await upsertUserByEmail(USER_A_EMAIL, 'Isolation User A')
  const householdA = await upsertHouseholdForUser(userA.id, 'Isolation Household A')
  const learnerA = await createLearner(householdA.id, { name: 'Learner A', gradeLevel: 'Grade 3' })

  const userB = await upsertUserByEmail(USER_B_EMAIL, 'Isolation User B')
  const householdB = await upsertHouseholdForUser(userB.id, 'Isolation Household B')
  const learnerB = await createLearner(householdB.id, { name: 'Learner B', gradeLevel: 'Grade 5' })

  console.log('Isolation seed complete:')
  console.log(`  User A: ${USER_A_EMAIL} → household ${householdA.id}, learner ${learnerA.id}`)
  console.log(`  User B: ${USER_B_EMAIL} → household ${householdB.id}, learner ${learnerB.id}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
