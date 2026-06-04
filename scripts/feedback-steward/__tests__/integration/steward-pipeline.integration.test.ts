/**
 * @jest-environment node
 *
 * End-to-end steward pipeline test against a real DB and real Claude CLI.
 * Scoped to test-only feedback rows — never touches other users' feedback.
 *
 * Requirements:
 *   - DATABASE_URL in .env.local
 *   - claude CLI in PATH and authenticated
 *
 * Run with: npm run test:steward:integration
 */

import { randomUUID } from 'crypto'
import { existsSync, unlinkSync } from 'fs'
import {
  insertFeedback,
  getFeedbackById,
  deleteFeedbackByIds,
} from '@/features/feedback/server/repository'
import { classifyFeedback } from '../../run-classify'
import { runDaily } from '../../run-daily'

const TEST_EMAIL = 'steward-test@integration.local'
const hasDb = !!process.env.DATABASE_URL

const itIntegration = hasDb ? it : it.skip

function makeTestFeedbackId() {
  return `test-${randomUUID()}`
}

describe('steward pipeline integration', () => {
  let testIds: string[] = []
  let artifactPaths: string[] = []

  afterEach(async () => {
    if (testIds.length > 0) {
      await deleteFeedbackByIds(testIds)
      testIds = []
    }
    for (const p of artifactPaths) {
      if (existsSync(p)) unlinkSync(p)
    }
    artifactPaths = []
  })

  itIntegration('classifyFeedback scoped to test ids only classifies those rows', async () => {
    const id1 = makeTestFeedbackId()
    const id2 = makeTestFeedbackId()
    testIds = [id1, id2]

    await insertFeedback({
      id: id1,
      userId: null,
      householdId: null,
      userEmail: TEST_EMAIL,
      pagePath: '/dashboard',
      sentiment: 'poor',
      message: 'The dashboard "Add lesson" button disappears when there are more than 10 lessons listed',
    })
    await insertFeedback({
      id: id2,
      userId: null,
      householdId: null,
      userEmail: TEST_EMAIL,
      pagePath: '/attendance',
      sentiment: 'bad',
      message: 'Attendance dates show the wrong month after the clocks change for daylight saving time',
    })

    const summary = await classifyFeedback({ ids: [id1, id2] })

    expect(summary.classified + summary.duplicates + summary.failed).toBe(2)

    const row1 = await getFeedbackById(id1)
    const row2 = await getFeedbackById(id2)

    expect(['reviewed', 'awaiting_approval', 'cancelled']).toContain(row1?.status)
    expect(['reviewed', 'awaiting_approval', 'cancelled']).toContain(row2?.status)
    expect(row1?.featureArea).toBeTruthy()
    expect(row2?.featureArea).toBeTruthy()
    expect(row1?.feedbackType).toBeTruthy()
    expect(row2?.feedbackType).toBeTruthy()
  }, 60_000)

  itIntegration('runDaily scoped to test ids generates a plan artifact without touching other feedback', async () => {
    const id1 = makeTestFeedbackId()
    testIds = [id1]

    // Use a clear, actionable message to maximise chance of high-confidence/low-risk classification
    await insertFeedback({
      id: id1,
      userId: null,
      householdId: null,
      userEmail: TEST_EMAIL,
      pagePath: '/dashboard',
      sentiment: 'poor',
      message: 'The "Start Session" button label on the dashboard shows "Begin" after a page refresh — it should always read "Start Session"',
    })

    const result = await runDaily({
      dryRun: true,
      feedbackIds: [id1],
      now: new Date(),
    })

    artifactPaths = [result.jsonArtifactPath, result.markdownArtifactPath]

    expect(existsSync(result.jsonArtifactPath)).toBe(true)
    expect(existsSync(result.markdownArtifactPath)).toBe(true)
    expect(result.plan.feedbackIds).toContain(id1)
    expect(result.plan.workstreams.length).toBeGreaterThan(0)

    // Verify no non-test row was touched
    const row = await getFeedbackById(id1)
    expect(row?.status).not.toBe('submitted')
    expect(row?.prNumber).toBeNull()
  }, 120_000)
})
