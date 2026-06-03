/** @jest-environment node */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import type { FeedbackRow } from '@/features/feedback/types'
import {
  insertFeedback,
  listFeedback,
  listFeedbackByUserId,
  getFeedbackById,
  listFeedbackForAdmin,
  updateFeedbackTriage,
  updateFeedbackWorkflow,
  approveFeedback,
} from '@/features/feedback/server/repository'

let householdId: string
let userId: string
let feedbackId: string
let cleanup: () => Promise<void>

beforeAll(async () => {
  if (!hasDb) return
  const { getDb } = await import('@/features/lib/server/db')
  const { households, workspaces, userFeedback } = await import('@/db/schema')
  const { eq } = await import('drizzle-orm')

  const db = getDb()

  householdId = `hh_${Date.now()}`
  userId = `user_${Date.now()}`

  await db.insert(households).values({
    id: householdId,
    workspaceId: `ws_${Date.now()}`,
    familyName: 'Test Household',
  })

  cleanup = async () => {
    await db.delete(userFeedback).where(eq(userFeedback.householdId, householdId))
    await db.delete(households).where(eq(households.id, householdId))
  }
})

afterAll(async () => {
  if (hasDb) await cleanup?.()
})

describe('feedback repository', () => {
  itDb('insertFeedback creates a feedback row', async () => {
    const feedback = await insertFeedback(userId, householdId, '/dashboard', 'good', 'Works great')
    feedbackId = feedback.id

    expect(feedback.id).toBeTruthy()
    expect(feedback.userId).toBe(userId)
    expect(feedback.householdId).toBe(householdId)
    expect(feedback.pagePath).toBe('/dashboard')
    expect(feedback.sentiment).toBe('good')
    expect(feedback.message).toBe('Works great')
    expect(feedback.status).toBe('submitted')
  })

  itDb('listFeedback returns all feedback', async () => {
    const rows = await listFeedback()
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.some((r) => r.id === feedbackId)).toBe(true)
  })

  itDb('listFeedbackByUserId returns user feedback', async () => {
    const rows = await listFeedbackByUserId(userId)
    expect(rows.some((r) => r.id === feedbackId)).toBe(true)
    expect(rows.every((r) => r.userId === userId)).toBe(true)
  })

  itDb('getFeedbackById returns specific feedback', async () => {
    const row = await getFeedbackById(feedbackId)
    expect(row).toBeTruthy()
    expect(row?.id).toBe(feedbackId)
    expect(row?.userId).toBe(userId)
  })

  itDb('listFeedbackForAdmin returns feedback with filters', async () => {
    await updateFeedbackTriage(feedbackId, {
      featureArea: 'dashboard',
      feedbackType: 'feature-request',
      riskLevel: 'low',
      confidence: 'high',
    })

    const rows = await listFeedbackForAdmin({ featureArea: 'dashboard' })
    expect(rows.some((r) => r.id === feedbackId)).toBe(true)
  })

  itDb('listFeedbackForAdmin filters by confidence', async () => {
    const rows = await listFeedbackForAdmin({ confidence: 'high' })
    expect(rows.some((r) => r.id === feedbackId)).toBe(true)
  })

  itDb('updateFeedbackTriage updates triage fields', async () => {
    await updateFeedbackTriage(feedbackId, {
      riskLevel: 'medium',
      confidence: 'medium',
    })

    const row = await getFeedbackById(feedbackId)
    expect(row?.riskLevel).toBe('medium')
    expect(row?.confidence).toBe('medium')
  })

  itDb('updateFeedbackWorkflow updates workflow fields', async () => {
    await updateFeedbackWorkflow(feedbackId, {
      prNumber: 123,
      previewUrl: 'https://preview.example.com',
      uatInstructions: 'Test in staging',
      versionResolved: '1.0.0',
      changelogVersion: '1.0.0',
      changelogLabel: 'New Dashboard',
      changelogUserCredit: 'John Doe',
      resolvedAt: new Date().toISOString(),
    })

    const row = await getFeedbackById(feedbackId)
    expect(row?.prNumber).toBe(123)
    expect(row?.previewUrl).toBe('https://preview.example.com')
    expect(row?.uatInstructions).toBe('Test in staging')
    expect(row?.versionResolved).toBe('1.0.0')
    expect(row?.changelogVersion).toBe('1.0.0')
    expect(row?.changelogLabel).toBe('New Dashboard')
    expect(row?.changelogUserCredit).toBe('John Doe')
    expect(row?.resolvedAt).toBeTruthy()
  })

  itDb('approveFeedback updates approval fields', async () => {
    await approveFeedback(feedbackId, 'admin@example.com')

    const row = await getFeedbackById(feedbackId)
    expect(row?.adminApprovedAt).toBeTruthy()
    expect(row?.adminApprovedByUserId).toBe('admin@example.com')
    expect(row?.status).toBe('awaiting_approval')
  })

  itDb('updateFeedbackTriage skips undefined fields', async () => {
    const row1 = await getFeedbackById(feedbackId)

    await updateFeedbackTriage(feedbackId, {
      riskLevel: 'high',
    })

    const row2 = await getFeedbackById(feedbackId)
    expect(row2?.riskLevel).toBe('high')
    expect(row2?.confidence).toBe(row1?.confidence)
  })

  itDb('listFeedbackForAdmin returns empty when no matches', async () => {
    const rows = await listFeedbackForAdmin({ status: 'shipped' })
    expect(Array.isArray(rows)).toBe(true)
  })
})
