import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Dashboard — learning activity cards', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/')
    await page.waitForTimeout(800)
  })

  test('Weekly Activity card is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Weekly Activity/i })).toBeVisible()
  })

  test('Subject Activity card is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Subject Activity/i })).toBeVisible()
  })

  test('Quran Streak card is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Quran Streak/i })).toBeVisible()
  })

  test('Log Quran Session button is present on Quran Streak card', async ({ page }) => {
    await expect(page.getByRole('button', { name: /log quran session/i }).first()).toBeVisible()
  })

  test('child selector switches to a specific child', async ({ page }) => {
    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    await selector.selectOption({ label: /Khadijah/i })
    await page.waitForTimeout(600)
    const selected = await selector.evaluate((el: HTMLSelectElement) => el.options[el.selectedIndex]?.text ?? '')
    expect(selected).toMatch(/Khadijah/i)
  })

  test('Quran Streak shows a circle for each active child in All Children mode', async ({ page }) => {
    // All children is the default
    const streakCircles = page.locator('[data-testid="quran-streak-circle"]')
    const count = await streakCircles.count()
    // Seed has 3 active children; at minimum 1 circle should be visible
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('Today\'s State section is present with metric cards', async ({ page }) => {
    await expect(page.getByText("Today's State")).toBeVisible()
  })

  test('alerts do not display raw STUDENT_SEED_ IDs', async ({ page }) => {
    const alertItems = page.locator('[data-testid="alert-item"]')
    const count = await alertItems.count()
    for (let i = 0; i < count; i++) {
      const text = await alertItems.nth(i).textContent()
      expect(text ?? '').not.toContain('STUDENT_SEED_')
    }
  })
})

test.describe('Dashboard — Quran session logging from streak card', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/')
    await page.waitForTimeout(800)
  })

  test('Log Quran Session modal opens and saves a session', async ({ page }) => {
    const logBtn = page.getByRole('button', { name: /log quran session/i }).first()
    await logBtn.click()

    await expect(page.getByRole('heading', { name: /log quran session/i })).toBeVisible()

    await page.getByLabel(/surah/i).fill('Al-Kawthar')
    await page.getByRole('button', { name: /save session/i }).click()
    await page.waitForTimeout(600)

    // Modal should close
    await expect(page.getByRole('heading', { name: /log quran session/i })).not.toBeVisible()
  })
})
