import {
  users,
  households,
  householdMembers,
  schoolYears,
  learners,
  subjects,
  lessonTasks,
  attendanceEvents,
  quranSessions,
  portfolioEvidence,
  householdSettings,
  userSettings,
  productValidationResponses,
  resources,
  scores,
  complianceDeadlines,
  badgeAwards,
  badgeDefinitions,
} from '../../db/schema'
import { getDb } from '../../features/lib/server/db'
import { bulkInsertRows } from './bulkInsert'
import type { DemoSeedPayload } from './buildPayload'

/**
 * Loads a demo payload using bulk INSERTs only (FK-safe order, single transaction).
 * Never issues one INSERT per row.
 */
export async function loadDemoSeedPayload(payload: DemoSeedPayload): Promise<void> {
  const db = getDb()
  const started = Date.now()

  // Warn if badge_definitions is empty — badge_awards FK references starter badge IDs
  // inserted by `npm run db:seed:reference`. Run that script first.
  if (payload.badgeAwards.length > 0) {
    const badgeDefCount = await db.select({ id: badgeDefinitions.id }).from(badgeDefinitions).limit(1)
    if (badgeDefCount.length === 0) {
      console.warn(
        'WARNING: badge_definitions is empty — run npm run db:seed:reference before npm run db:seed:demo for badge award rows to succeed.',
      )
    }
  }

  console.log('  Loading bulk inserts (single transaction)…')

  await db.transaction(async tx => {
    await bulkInsertRows(tx, users, payload.users, 'users')
    await bulkInsertRows(tx, households, payload.households, 'households')
    await bulkInsertRows(tx, householdMembers, payload.householdMembers, 'household_members')
    await bulkInsertRows(tx, schoolYears, payload.schoolYears, 'school_years')
    await bulkInsertRows(tx, learners, payload.learners, 'learners')
    await bulkInsertRows(tx, subjects, payload.subjects, 'subjects')
    await bulkInsertRows(tx, attendanceEvents, payload.attendanceEvents, 'attendance_events')
    await bulkInsertRows(tx, lessonTasks, payload.lessonTasks, 'lesson_tasks')
    await bulkInsertRows(tx, quranSessions, payload.quranSessions, 'quran_sessions')
    await bulkInsertRows(tx, portfolioEvidence, payload.portfolioEvidence, 'portfolio_evidence')
    await bulkInsertRows(tx, householdSettings, payload.householdSettings, 'household_settings')
    await bulkInsertRows(tx, userSettings, payload.userSettings, 'user_settings')
    await bulkInsertRows(tx, productValidationResponses, payload.productValidationResponses, 'product_validation_responses')
    await bulkInsertRows(tx, resources, payload.resources, 'resources')
    // New tables — insert after parent tables are in place
    // scores: chunked at 200 rows
    await bulkInsertRows(tx, scores, payload.scores, 'scores')
    // compliance_deadlines: chunked at 50 rows (bulkInsert uses BULK_CHUNK_SIZE=1000 by default)
    await bulkInsertRows(tx, complianceDeadlines, payload.complianceDeadlines, 'compliance_deadlines')
    // badge_awards: requires badge_definitions (from db:seed:reference) — FK enforced at DB level
    await bulkInsertRows(tx, badgeAwards, payload.badgeAwards, 'badge_awards')
  })

  const elapsed = ((Date.now() - started) / 1000).toFixed(1)
  console.log(`  ✓ Loaded in ${elapsed}s`)
}
