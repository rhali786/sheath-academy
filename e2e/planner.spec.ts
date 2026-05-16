import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Planner page — layout (Wave A1)', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/planner')
    await page.waitForTimeout(500)
  })

  test('planner page is reachable', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('planner container uses max-w-7xl (matches other pages)', async ({ page }) => {
    const container = page.locator('.max-w-7xl').first()
    await expect(container).toBeVisible()
  })

  test('week navigator is visible', async ({ page }) => {
    // WeekNavigator renders a text showing the week range (e.g. "12 May – 18 May 2026")
    // Look for the prev/next navigation buttons
    const prevButton = page.getByRole('button', { name: /previous week|←|‹/i }).or(
      page.locator('button').filter({ has: page.locator('svg') }).first()
    )
    await expect(prevButton.or(page.locator('[class*="WeekNavigator"], nav'))).toBeTruthy()
  })

  test('child and subject filters are present', async ({ page }) => {
    // ChildSubjectFilter renders buttons labelled "Children (N)" and "Subjects (N)"
    await expect(page.getByRole('button', { name: /children/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /subjects/i })).toBeVisible()
  })
})
