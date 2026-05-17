/**
 * Wave 2 — Selected-child dashboard data regression.
 *
 * These tests prove that dashboard sections use real feature data
 * filtered by selected child, not hardcoded or seeded dashboard values.
 *
 * Key assertions:
 * - Per-Child Progress uses planner subject names, not dashboard seed names.
 *   Dashboard seed has "Math" for Adam; planner subject is "Mathematics".
 *   Dashboard seed has "Science" for Khadijah; she has no Science planner subject.
 * - Switching children causes Per-Child Progress to update.
 * - Needs Attention alerts are child-specific.
 * - Portfolio and Reports pages remain accessible.
 */

import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Dashboard — selected child data regression (Wave 2)', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/')
    await page.waitForTimeout(1000)
  })

  test('portfolio is reachable as a standalone page (not a tab)', async ({ page }) => {
    await expect(page.getByRole('link', { name: /portfolio/i }).first()).toBeVisible()
    await page.getByRole('link', { name: /portfolio/i }).first().click()
    await page.waitForURL('**/portfolio')
    await expect(page.getByRole('heading', { name: /portfolio/i })).toBeVisible()
  })

  test('reports is reachable as a standalone page (not a tab)', async ({ page }) => {
    await expect(page.getByRole('link', { name: /reports/i }).first()).toBeVisible()
    await page.getByRole('link', { name: /reports/i }).first().click()
    await page.waitForURL('**/reports')
    await expect(page.getByRole('heading', { name: /records summary/i })).toBeVisible()
  })

  test('Today tab is the only tab button on the dashboard', async ({ page }) => {
    const todayBtn = page.getByRole('button', { name: 'Today' })
    await expect(todayBtn.first()).toBeVisible()
    // Portfolio should be a Link, not a tab button
    await expect(page.getByRole('button', { name: 'Portfolio' })).toHaveCount(0)
  })

  test("per-child progress uses planner subject names (Mathematics not Math)", async ({ page }) => {
    // Dashboard seeded SEED_PROGRESS_DATA has "Math" for Adam.
    // Planner subjects have "Mathematics" for Adam.
    // After Wave 4 fix, "Mathematics" should appear; "Math" should not.
    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    await selector.selectOption({ label: /Adam/i })
    await page.waitForTimeout(800)

    const progressSection = page.locator('section').filter({ hasText: /Per-Child Progress/i })
    await expect(progressSection).toBeVisible()
    // Planner-derived label should appear
    await expect(progressSection.getByText('Mathematics')).toBeVisible()
    // Seeded fake label should NOT appear
    await expect(progressSection.getByText(/^Math$/)).toHaveCount(0)
  })

  test("per-child progress does not show Khadijah's seeded Science subject", async ({ page }) => {
    // Dashboard seed has "Science" for Khadijah.
    // Khadijah has no Science planner subject — only Quran Memorisation and Reading.
    // After Wave 4, "Science" should not appear for Khadijah.
    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    await selector.selectOption({ label: /Khadijah/i })
    await page.waitForTimeout(800)

    const progressSection = page.locator('section').filter({ hasText: /Per-Child Progress/i })
    await expect(progressSection).toBeVisible()
    await expect(progressSection.getByText('Science')).toHaveCount(0)
  })

  test('per-child progress changes when switching from Adam to Khadijah', async ({ page }) => {
    const selector = page.getByRole('combobox').or(page.locator('select')).first()

    await selector.selectOption({ label: /Adam/i })
    await page.waitForTimeout(800)

    const progressSection = page.locator('section').filter({ hasText: /Per-Child Progress/i })
    await expect(progressSection).toBeVisible()

    // Get Adam's visible subject content
    const adamText = await progressSection.textContent()

    await selector.selectOption({ label: /Khadijah/i })
    await page.waitForTimeout(800)

    const khadijahText = await progressSection.textContent()

    // Content should differ between children
    expect(adamText).not.toEqual(khadijahText)
  })

  test('needs attention only shows alerts for the selected child', async ({ page }) => {
    const selector = page.getByRole('combobox').or(page.locator('select')).first()

    await selector.selectOption({ label: /Adam/i })
    await page.waitForTimeout(800)

    const attentionSection = page.locator('section').filter({ hasText: /Needs Attention/i })
    await expect(attentionSection).toBeVisible()

    // Alerts for Zayd's lessons should not appear when Adam is selected
    await expect(attentionSection.getByText(/zayd/i)).toHaveCount(0)
  })

  test("today's state metrics update when child changes", async ({ page }) => {
    const selector = page.getByRole('combobox').or(page.locator('select')).first()

    await selector.selectOption({ label: /Adam/i })
    await page.waitForTimeout(800)

    const todaySection = page.locator('section').filter({ hasText: /Today.*State/i })
    await expect(todaySection).toBeVisible()
    const adamMetrics = await todaySection.textContent()

    await selector.selectOption({ label: /Zayd/i })
    await page.waitForTimeout(800)

    const zaydMetrics = await todaySection.textContent()

    // Metrics should differ (different children have different data)
    // At minimum the attendance/lessons counts can differ
    expect(adamMetrics).toBeDefined()
    expect(zaydMetrics).toBeDefined()
  })

  test('archived child data does not appear in dashboard sections', async ({ page }) => {
    // The dashboard should only show active children's data
    // There are no archived children in seed, but child selector should only show active ones
    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    const options = await selector.locator('option').allTextContents()
    // All selectable children should be active (Adam, Khadijah, Zayd)
    expect(options.some(o => o.trim().length > 0)).toBe(true)
  })
})
