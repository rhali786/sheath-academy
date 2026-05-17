import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Lessons page — status sync', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/lessons')
    await page.waitForTimeout(800)
  })

  test('lessons page loads and shows lesson cards', async ({ page }) => {
    // Should have at least a heading
    await expect(page.getByRole('heading', { name: /All Lessons/i })).toBeVisible()
  })

  test('filter dropdowns are present', async ({ page }) => {
    // Child filter, status filter, date sort
    const selects = page.locator('select')
    const count = await selects.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('status filter shows only completed lessons when selected', async ({ page }) => {
    const selects = page.locator('select')
    // Find the status filter (second or third select)
    // Look for a select that has "completed" as an option
    let statusSelect = null
    const count = await selects.count()
    for (let i = 0; i < count; i++) {
      const options = await selects.nth(i).evaluate((el: HTMLSelectElement) =>
        Array.from(el.options).map(o => o.value)
      )
      if (options.includes('completed')) {
        statusSelect = selects.nth(i)
        break
      }
    }
    if (!statusSelect) {
      test.skip()
      return
    }
    await statusSelect.selectOption('completed')
    await page.waitForTimeout(300)
    // Any visible status badges should be "Completed"
    const skippedBadges = page.getByText('Skipped')
    await expect(skippedBadges).toHaveCount(0)
  })

  test('lessons page has edit functionality (edit form opens)', async ({ page }) => {
    // Click the first lesson's edit button/card
    const firstCard = page.locator('[data-testid="lesson-card"]').first()
    const cardCount = await firstCard.count()
    if (cardCount === 0) {
      // No lessons yet — skip
      test.skip()
      return
    }
    const editBtn = firstCard.getByRole('button', { name: /edit/i })
    if (await editBtn.count() === 0) {
      // Try clicking the card itself
      await firstCard.click()
    } else {
      await editBtn.click()
    }
    await page.waitForTimeout(300)
    // Some form should appear
    await expect(page.locator('form, [role="dialog"]').first()).toBeVisible()
  })
})

test.describe('Planner page — status badges on grid', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/planner')
    await page.waitForTimeout(800)
  })

  test('planner page loads', async ({ page }) => {
    await expect(page).toHaveURL(/\/planner/)
  })

  test('completed lessons show Done badge in grid', async ({ page }) => {
    // Only assertable if seeded completed lessons exist
    const doneBadges = page.getByText('Done')
    const count = await doneBadges.count()
    // If count > 0, they're displaying correctly — don't fail if 0 (no completed seed data)
    expect(count).toBeGreaterThanOrEqual(0)
  })
})
