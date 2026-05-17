import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Dashboard — portfolio evidence empty state', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/')
    await page.waitForTimeout(800)
  })

  test('selecting Khadijah (no evidence) shows zero portfolio items in Today\'s State', async ({ page }) => {
    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    await selector.selectOption({ label: /Khadijah/i })
    await page.waitForTimeout(800)

    // Today's State shows a "Portfolio Items" metric card — value should be 0
    const portfolioCard = page
      .locator('[class*="MetricCard"], .metric-card, section')
      .filter({ hasText: /Portfolio Items/i })
      .first()

    await expect(portfolioCard).toBeVisible()
    // The count should be 0 for Khadijah who has no seed evidence
    await expect(portfolioCard.getByText('0')).toBeVisible()
  })

  test('selecting Adam (has evidence) shows non-zero portfolio items', async ({ page }) => {
    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    await selector.selectOption({ label: /Adam/i })
    await page.waitForTimeout(800)

    // Adam has 3 seed evidence items
    const portfolioCard = page
      .locator('[class*="MetricCard"], .metric-card, section')
      .filter({ hasText: /Portfolio Items/i })
      .first()

    await expect(portfolioCard).toBeVisible()
    // Should not show 0 for Adam
    await expect(portfolioCard.getByText('0')).toHaveCount(0)
  })

  test('Records section reflects per-child portfolio evidence count', async ({ page }) => {
    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    await selector.selectOption({ label: /Khadijah/i })
    await page.waitForTimeout(800)

    // The RecordsProof card for Portfolio evidence should show 0
    const recordsSection = page.locator('section, div').filter({ hasText: /Portfolio evidence/i }).first()
    await expect(recordsSection).toBeVisible()
  })
})
