import { test, expect } from '@playwright/test'
import { getDb } from '../features/lib/server/db'
import { users, households, passwordResetTokens } from '../db/schema'
import { eq } from 'drizzle-orm'

const TS = Date.now()
const TEST_EMAIL = `cred-e2e-${TS}@sheath.test`
const TEST_USERNAME = `creduser${TS}`
const TEST_PASSWORD = 'E2ePassword123!'
const NEW_PASSWORD = 'NewE2ePassword456!'

async function cleanupTestUser() {
  if (!process.env.DATABASE_URL) return
  const db = getDb()
  const row = await db.select().from(users).where(eq(users.email, TEST_EMAIL)).limit(1)
  if (!row[0]) return
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, row[0].id))
  await db.delete(households).where(eq(households.userId, row[0].id))
  await db.delete(users).where(eq(users.id, row[0].id))
}

test.beforeAll(async () => {
  await cleanupTestUser()
})

test.afterAll(async () => {
  await cleanupTestUser()
})

test.describe('Fallback credentials auth', () => {
  test('/signup is reachable without signing in', async ({ page }) => {
    await page.goto('/signup')
    await expect(page).toHaveURL(/\/signup/)
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
  })

  test('/forgot-password is reachable without signing in', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page).toHaveURL(/\/forgot-password/)
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible()
  })

  test('parent can sign up with email, username, and password', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel('Name').fill('Cred E2E User')
    await page.getByLabel('Email').fill(TEST_EMAIL)
    await page.getByLabel('Username').fill(TEST_USERNAME)
    await page.getByLabel(/^password$/i).fill(TEST_PASSWORD)
    await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page.getByText(/account created/i)).toBeVisible({ timeout: 10_000 })
  })

  test('sign in with email and password', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email or username/i).fill(TEST_EMAIL)
    await page.getByLabel(/^password$/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /^sign in$/i }).click()
    await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 15_000 })
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('sign in with username and password', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email or username/i).fill(TEST_USERNAME)
    await page.getByLabel(/^password$/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /^sign in$/i }).click()
    await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 15_000 })
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('wrong password shows generic error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email or username/i).fill(TEST_EMAIL)
    await page.getByLabel(/^password$/i).fill('wrongpassword')
    await page.getByRole('button', { name: /^sign in$/i }).click()
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('forgot password shows generic confirmation', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByLabel(/email or username/i).fill(TEST_EMAIL)
    await page.getByRole('button', { name: /send reset link/i }).click()
    await expect(page.getByText(/If this account can receive email/i)).toBeVisible({ timeout: 10_000 })
  })

  test('reset password with DB-retrieved token', async ({ page }) => {
    if (!process.env.DATABASE_URL) {
      test.skip()
      return
    }

    // Create a reset token directly in DB (simulates email click)
    const { createResetToken } = await import('../features/auth/server/passwordResetTokens')
    const db = getDb()
    const userRow = await db.select().from(users).where(eq(users.email, TEST_EMAIL)).limit(1)
    if (!userRow[0]) throw new Error('Test user not found — run signup test first')
    const rawToken = await createResetToken(userRow[0].id)

    await page.goto(`/reset-password?token=${encodeURIComponent(rawToken)}`)
    await expect(page.getByRole('heading', { name: /set new password/i })).toBeVisible()
    await page.getByLabel(/new password/i).fill(NEW_PASSWORD)
    await page.getByLabel(/confirm password/i).fill(NEW_PASSWORD)
    await page.getByRole('button', { name: /update password/i }).click()
    await expect(page.getByText(/password updated/i)).toBeVisible({ timeout: 10_000 })
  })

  test('old password fails after reset', async ({ page }) => {
    if (!process.env.DATABASE_URL) {
      test.skip()
      return
    }
    await page.goto('/login')
    await page.getByLabel(/email or username/i).fill(TEST_EMAIL)
    await page.getByLabel(/^password$/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /^sign in$/i }).click()
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5_000 })
  })

  test('new password works after reset', async ({ page }) => {
    if (!process.env.DATABASE_URL) {
      test.skip()
      return
    }
    await page.goto('/login')
    await page.getByLabel(/email or username/i).fill(TEST_EMAIL)
    await page.getByLabel(/^password$/i).fill(NEW_PASSWORD)
    await page.getByRole('button', { name: /^sign in$/i }).click()
    await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 15_000 })
    await expect(page).not.toHaveURL(/\/login/)
  })
})
