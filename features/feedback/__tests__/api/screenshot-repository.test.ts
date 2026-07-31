/** @jest-environment node */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import {
  insertFeedback,
  getFeedbackScreenshot,
  getFeedbackById,
  MAX_FEEDBACK_SCREENSHOT_BYTES,
} from '@/features/feedback/server/repository'

let householdId: string
let cleanup: () => Promise<void>

beforeAll(async () => {
  if (!hasDb) return
  const { getDb } = await import('@/features/lib/server/db')
  const { households, userFeedback, users } = await import('@/db/schema')
  const { eq } = await import('drizzle-orm')

  const db = getDb()
  householdId = `hh_screenshot_${Date.now()}`
  const userId = `user_screenshot_${Date.now()}`
  const now = new Date()

  await db.insert(users).values({
    id: userId,
    email: `screenshot-test-${Date.now()}@integration.local`,
    createdAt: now,
    updatedAt: now,
  })
  await db.insert(households).values({
    id: householdId,
    userId,
    name: 'Test Household',
    createdAt: now,
    updatedAt: now,
  })

  cleanup = async () => {
    await db.delete(userFeedback).where(eq(userFeedback.householdId, householdId))
    await db.delete(households).where(eq(households.id, householdId))
    await db.delete(users).where(eq(users.id, userId))
  }
})

afterAll(async () => {
  if (hasDb) await cleanup?.()
})

describe('feedback repository — screenshot attachment', () => {
  itDb('round-trips screenshot bytes and mime type exactly', async () => {
    const { randomUUID } = await import('crypto')
    const id = randomUUID()
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01, 0x02, 0x03])

    await insertFeedback({
      id,
      userId: null,
      householdId,
      userEmail: 'screenshot-test@integration.local',
      pagePath: '/dashboard',
      sentiment: 'good',
      message: 'With screenshot',
      screenshotData: bytes,
      screenshotMimeType: 'image/png',
    })

    const screenshot = await getFeedbackScreenshot(id)
    expect(screenshot).not.toBeNull()
    expect(screenshot?.mimeType).toBe('image/png')
    expect(Buffer.compare(screenshot!.data, bytes)).toBe(0)

    const row = await getFeedbackById(id)
    expect(row?.hasScreenshot).toBe(true)
  })

  itDb('leaves hasScreenshot false and getFeedbackScreenshot null when no image is attached', async () => {
    const { randomUUID } = await import('crypto')
    const id = randomUUID()

    await insertFeedback({
      id,
      userId: null,
      householdId,
      userEmail: 'no-screenshot-test@integration.local',
      pagePath: '/dashboard',
      sentiment: 'okay',
      message: 'No screenshot',
    })

    const screenshot = await getFeedbackScreenshot(id)
    expect(screenshot).toBeNull()

    const row = await getFeedbackById(id)
    expect(row?.hasScreenshot).toBe(false)
  })

  itDb('rejects an oversized screenshot at the repository boundary', async () => {
    const { randomUUID } = await import('crypto')
    const id = randomUUID()
    const oversized = Buffer.alloc(MAX_FEEDBACK_SCREENSHOT_BYTES + 1)

    await expect(
      insertFeedback({
        id,
        userId: null,
        householdId,
        userEmail: 'oversized-test@integration.local',
        pagePath: '/dashboard',
        sentiment: 'bad',
        screenshotData: oversized,
        screenshotMimeType: 'image/png',
      }),
    ).rejects.toThrow(/exceeds limit/)
  })
})
