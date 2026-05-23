import {
  users,
  households,
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

  console.log('  Loading bulk inserts (single transaction)…')

  await db.transaction(async tx => {
    await bulkInsertRows(tx, users, payload.users, 'users')
    await bulkInsertRows(tx, households, payload.households, 'households')
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
  })

  const elapsed = ((Date.now() - started) / 1000).toFixed(1)
  console.log(`  ✓ Loaded in ${elapsed}s`)
}
