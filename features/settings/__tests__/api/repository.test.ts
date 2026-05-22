/** @jest-environment node */

/**
 * Settings repository tests.
 * Require a real Postgres connection; skipped automatically when DATABASE_URL is not set.
 * Uses the household repository to set up FK-compliant test rows.
 */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import {
  getHouseholdSetting,
  setHouseholdSetting,
  getAllHouseholdSettings,
  getUserSetting,
  setUserSetting,
} from '../../server/repository'
import { upsertUserByEmail, upsertHouseholdForUser } from '@/features/household/server/repository'

const TS = Date.now()
const testEmail = `settings-repo-test-${TS}@sheath.test`

let testUserId = ''
let testHouseholdId = ''

beforeAll(async () => {
  if (!hasDb) return
  const user = await upsertUserByEmail(testEmail, 'Settings Test User')
  testUserId = user.id
  const household = await upsertHouseholdForUser(user.id, 'Settings Test Household')
  testHouseholdId = household.id
})

afterAll(async () => {
  if (!hasDb) return
  const { getDb } = await import('@/features/lib/server/db')
  const { householdSettings, userSettings, households, users } = await import('@/db/schema')
  const { eq } = await import('drizzle-orm')
  const db = getDb()
  if (testHouseholdId) {
    await db.delete(householdSettings).where(eq(householdSettings.householdId, testHouseholdId))
    await db.delete(households).where(eq(households.id, testHouseholdId))
  }
  if (testUserId) {
    await db.delete(userSettings).where(eq(userSettings.userId, testUserId))
    await db.delete(users).where(eq(users.id, testUserId))
  }
})

describe('settings repository — household settings', () => {
  itDb('setHouseholdSetting upserts a setting', async () => {
    await setHouseholdSetting(testHouseholdId, 'weekStartDay', 'Saturday')
    const value = await getHouseholdSetting(testHouseholdId, 'weekStartDay')
    expect(value).toBe('Saturday')
  })

  itDb('setHouseholdSetting updates an existing setting', async () => {
    await setHouseholdSetting(testHouseholdId, 'weekStartDay', 'Saturday')
    await setHouseholdSetting(testHouseholdId, 'weekStartDay', 'Sunday')
    const value = await getHouseholdSetting(testHouseholdId, 'weekStartDay')
    expect(value).toBe('Sunday')
  })

  itDb('getAllHouseholdSettings returns a key-value map', async () => {
    await setHouseholdSetting(testHouseholdId, 'timezone', 'Asia/Riyadh')
    const all = await getAllHouseholdSettings(testHouseholdId)
    expect(all['timezone']).toBe('Asia/Riyadh')
  })

  itDb('getHouseholdSetting returns undefined for unknown key', async () => {
    const value = await getHouseholdSetting(testHouseholdId, 'nonexistent_key_xyz')
    expect(value).toBeUndefined()
  })
})

describe('settings repository — user settings', () => {
  itDb('setUserSetting upserts a setting', async () => {
    await setUserSetting(testUserId, 'reminderDismissed', true)
    const value = await getUserSetting(testUserId, 'reminderDismissed')
    expect(value).toBe(true)
  })

  itDb('setUserSetting updates an existing setting', async () => {
    await setUserSetting(testUserId, 'reminderDismissed', true)
    await setUserSetting(testUserId, 'reminderDismissed', false)
    const value = await getUserSetting(testUserId, 'reminderDismissed')
    expect(value).toBe(false)
  })

  itDb('getUserSetting returns undefined for unknown key', async () => {
    const value = await getUserSetting(testUserId, 'unknown_key_xyz')
    expect(value).toBeUndefined()
  })
})
