/**
 * Seeds demo data for the dev/preview user only.
 * Run with: npm run db:seed:dev
 *
 * Idempotent: stable user/household/learner IDs (see DEV_PG_SEED).
 * Re-run safe; does not create duplicate learners per run.
 */

import { getDevSeedUserEmail } from '../features/lib/server/devUserEmail'
import { DEV_PG_SEED } from '../features/lib/seedIds'
import { upsertUserByEmail, upsertHouseholdForUser } from '../features/household/server/repository'
import { upsertLearner } from '../features/children/server/repository'
import { upsertSubjectRow } from '../features/subjects/server/repository'
import { createLessonTaskRow } from '../features/plan/server/repository'
import { createAttendanceEvent } from '../features/attendance/server/repository'
import { upsertQuranSessionRow } from '../features/quran/server/repository'
import { createEvidenceRow } from '../features/portfolio/server/repository'

async function main() {
  const email = getDevSeedUserEmail()

  console.log(`db:seed:dev — seeding demo data for: ${email}`)

  const user = await upsertUserByEmail(email, 'Dev User', DEV_PG_SEED.userId)
  const household = await upsertHouseholdForUser(
    user.id,
    'Demo Household',
    DEV_PG_SEED.householdId,
  )
  console.log(`  household: ${household.id}`)

  const layth = await upsertLearner(household.id, DEV_PG_SEED.layth, {
    name: 'Layth',
    gradeLevel: 'Grade 4',
  })
  const hawa = await upsertLearner(household.id, DEV_PG_SEED.hawa, {
    name: 'Hawa',
    gradeLevel: 'Grade 1',
  })
  console.log(`  learners: ${layth.id}, ${hawa.id}`)

  const mathSubject = await upsertSubjectRow(household.id, DEV_PG_SEED.mathSubject, {
    name: 'Mathematics',
    category: 'core',
    learnerId: layth.id,
  })
  const quranSubject = await upsertSubjectRow(household.id, DEV_PG_SEED.quranSubject, {
    name: 'Quran',
    category: 'quran',
    learnerId: layth.id,
  })
  console.log(`  subjects: ${mathSubject.id}, ${quranSubject.id}`)

  const today = new Date().toISOString().split('T')[0]
  await createLessonTaskRow(household.id, {
    learnerId: layth.id,
    subjectId: mathSubject.id,
    title: 'Complete worksheet 1–5',
    dueDate: today,
  })
  await createLessonTaskRow(household.id, {
    learnerId: layth.id,
    subjectId: quranSubject.id,
    title: 'Review Al-Fatiha',
    dueDate: today,
    status: 'completed',
  })
  console.log('  lesson tasks created')

  await createAttendanceEvent(household.id, {
    learnerId: layth.id,
    attendanceDate: today,
    status: 'present',
    minutes: 360,
  })
  await createAttendanceEvent(household.id, {
    learnerId: hawa.id,
    attendanceDate: today,
    status: 'present',
    minutes: 240,
  })
  console.log('  attendance events created')

  await upsertQuranSessionRow(household.id, DEV_PG_SEED.quranSessionToday, {
    learnerId: layth.id,
    sessionDate: today,
    sessionType: 'memorization',
    surah: 'Al-Fatiha',
    fromAyah: 1,
    toAyah: 7,
  })
  console.log('  quran session created')

  await createEvidenceRow(household.id, {
    learnerId: layth.id,
    title: 'Math worksheet photo',
    evidenceType: 'work_sample',
    evidenceDate: today,
    subjectId: mathSubject.id,
  })
  console.log('  portfolio evidence created')

  console.log('db:seed:dev — done')
  console.log(`\nDemo data: household ${household.id} (user: ${email}).`)
  console.log('Run npm run db:reset:dev to wipe dev + isolation test rows and re-seed.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
