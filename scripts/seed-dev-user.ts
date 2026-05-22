/**
 * Seeds demo data for the dev/preview user only.
 * Run with: npm run db:seed:dev
 *
 * Rules:
 *  - Reads DEV_SEED_USER_EMAIL from the environment.
 *  - Creates or updates that user's household and demo records idempotently.
 *  - Does NOT run automatically for normal users.
 *  - Demo data is quarantined to this household only.
 *
 * Phase 1: Skeleton — actual seeding is wired in Phase 9 once all
 *   feature repositories exist.
 */

async function main() {
  const email = process.env.DEV_SEED_USER_EMAIL
  if (!email) {
    console.error(
      'Error: DEV_SEED_USER_EMAIL is not set.\n' +
        'Add it to .env.local before running db:seed:dev.',
    )
    process.exit(1)
  }

  console.log(`db:seed:dev — target user: ${email}`)
  console.log('Phase 1 skeleton: no rows seeded yet.')
  console.log(
    'Phase 9 will insert demo learners, subjects, lessons, attendance, Quran sessions, and evidence.',
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
