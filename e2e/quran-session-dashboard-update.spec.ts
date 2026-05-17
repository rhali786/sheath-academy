import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Dashboard — Qur\'an session save updates state', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/')
    await page.waitForTimeout(800)

    // Select Khadijah
    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    await selector.selectOption({ label: /Khadijah/i })
    await page.waitForTimeout(600)
  })

  test('Khadijah\'s Quran section has a Log Session button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /log session/i }).first()).toBeVisible()
  })

  test('saving a Quran session for Khadijah shows the session details', async ({ page }) => {
    // Open log session modal for Khadijah
    const logBtn = page.getByRole('button', { name: /log session/i }).first()
    await logBtn.click()

    // Modal should open
    await expect(page.getByRole('heading', { name: /log quran session/i })).toBeVisible()

    // Fill in surah
    await page.getByLabel(/surah/i).fill('Al-Fatiha')

    // Save
    await page.getByRole('button', { name: /save session/i }).click()
    await page.waitForTimeout(800)

    // Session details should now appear for Khadijah's card
    await expect(page.getByText('Al-Fatiha')).toBeVisible()
  })

  test('saving a Quran session does not affect Zayd\'s card', async ({ page }) => {
    // Log a session for Khadijah
    await page.getByRole('button', { name: /log session/i }).first().click()
    await page.getByLabel(/surah/i).fill('Al-Falaq')
    await page.getByRole('button', { name: /save session/i }).click()
    await page.waitForTimeout(600)

    // Switch to Zayd
    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    await selector.selectOption({ label: /Zayd/i })
    await page.waitForTimeout(600)

    // Zayd's section should not show Al-Falaq (Khadijah's session)
    await expect(page.getByText('Al-Falaq')).toHaveCount(0)
  })
})
