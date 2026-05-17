import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Dashboard — archive excludes student from active metrics', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
  })

  test('Adam appears in children list before archiving', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(600)
    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    const options = await selector.evaluate((el: HTMLSelectElement) =>
      Array.from(el.options).map(o => o.text)
    )
    expect(options.some(o => /Adam/i.test(o))).toBe(true)
  })

  test("Adam's needs-attention alert is visible before archiving", async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(600)

    // Select Adam (first child by default, or select explicitly)
    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    await selector.selectOption({ label: /Adam/i })
    await page.waitForTimeout(600)

    // The needs-attention panel should show Adam's Quran revision alert
    const needsAttention = page.locator('section, aside, div').filter({ hasText: /Quran revision missed/i })
    await expect(needsAttention).toBeVisible()
  })

  test('after archiving Adam, his needs-attention alert is gone', async ({ page }) => {
    // Archive Adam via the children/settings page
    await page.goto('/settings')
    await page.waitForTimeout(500)

    // Find Adam's archive button — the settings page renders children with archive actions
    const archiveBtn = page.getByRole('button', { name: /archive/i }).first()
    if (await archiveBtn.count() > 0) {
      await archiveBtn.click()
      // Confirm dialog if present
      const confirmBtn = page.getByRole('button', { name: /confirm|yes|ok/i })
      if (await confirmBtn.count() > 0) {
        await confirmBtn.click()
      }
      await page.waitForTimeout(600)
    } else {
      // Archive via API call directly if no UI button
      await page.request.post('/api/children', {
        data: JSON.stringify({ action: 'ARCHIVE', id: 'student_seed_adam_001' }),
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Go to dashboard
    await page.goto('/')
    await page.waitForTimeout(800)

    // Adam's alert should not be visible
    await expect(page.getByText('Quran revision missed')).toHaveCount(0)
  })
})
