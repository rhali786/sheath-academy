/**
 * Seeds demo data for the dev/preview user only.
 * Run with: npm run db:seed:dev
 *
 * Rules:
 *  - Reads DEV_SEED_USER_EMAIL from the environment.
 *  - Creates or updates that user's one household (idempotent).
 *  - Inserts demo learners, subjects, lesson tasks, attendance events,
 *    Qur'an sessions, and portfolio evidence under that household only.
 *  - Uses timestamp-prefixed IDs to remain runnable multiple times without collision.
 *  - Does NOT run automatically for normal users.
 *  - Demo data is quarantined to this one household.
 */

import { upsertUserByEmail, upsertHouseholdForUser } from '../features/household/server/repository'
import { createLearner } from '../features/children/server/repository'
import { createSubjectRow } from '../features/subjects/server/repository'
import { createLessonTaskRow } from '../features/plan/server/repository'
import { createAttendanceEvent } from '../features/attendance/server/repository'
import { createQuranSessionRow } from '../features/quran/server/repository'
import { createEvidenceRow } from '../features/portfolio/server/repository'

async function main() {
  const email = process.env.DEV_SEED_USER_EMAIL
  if (!email) {
    console.error(
      'Error: DEV_SEED_USER_EMAIL is not set.\n' +
        'Add it to .env.local before running db:seed:dev.',
    )
    process.exit(1)
  }

  console.log(`db:seed:dev — seeding demo data for: ${email}`)

  const user = await upsertUserByEmail(email, 'Dev User')
  const household = await upsertHouseholdForUser(user.id, 'Demo Household')
  console.log(`  household: ${household.id}`)

  // Learners
  const layth = await createLearner(household.id, { name: 'Layth', gradeLevel: 'Grade 4' })
  const hawa = await createLearner(household.id, { name: 'Hawa', gradeLevel: 'Grade 1' })
  console.log(`  learners: ${layth.id}, ${hawa.id}`)

  // Subjects
  const mathSubject = await createSubjectRow(household.id, { name: 'Mathematics', category: 'core', learnerId: layth.id })
  const quranSubject = await createSubjectRow(household.id, { name: 'Quran', category: 'quran', learnerId: layth.id })
  console.log(`  subjects: ${mathSubject.id}, ${quranSubject.id}`)

  // Lesson tasks
  const today = new Date().toISOString().split('T')[0]
  await createLessonTaskRow(household.id, { learnerId: layth.id, subjectId: mathSubject.id, title: 'Complete worksheet 1–5', dueDate: today })
  await createLessonTaskRow(household.id, { learnerId: layth.id, subjectId: quranSubject.id, title: 'Review Al-Fatiha', dueDate: today, status: 'completed' })
  console.log('  lesson tasks created')

  // Attendance events
  await createAttendanceEvent(household.id, { learnerId: layth.id, attendanceDate: today, status: 'present', minutes: 360 })
  await createAttendanceEvent(household.id, { learnerId: hawa.id, attendanceDate: today, status: 'present', minutes: 240 })
  console.log('  attendance events created')

  // Qur'an sessions
  await createQuranSessionRow(household.id, { learnerId: layth.id, sessionDate: today, sessionType: 'memorization', surah: 'Al-Fatiha', fromAyah: 1, toAyah: 7 })
  console.log('  quran session created')

  // Portfolio evidence
  await createEvidenceRow(household.id, { learnerId: layth.id, title: 'Math worksheet photo', evidenceType: 'work_sample', evidenceDate: today, subjectId: mathSubject.id })
  console.log('  portfolio evidence created')

  console.log('db:seed:dev — done')
  console.log(`\nNote: Demo data belongs only to household ${household.id} (user: ${email}).`)
  console.log('Other users will see an empty app.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
