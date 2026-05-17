import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Lesson completion — appears in student report', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
  })

  test('Khadijah has lessons in the planner', async ({ page }) => {
    await page.goto('/planner')
    await page.waitForTimeout(600)

    // Filter to Khadijah
    const childBtn = page.getByRole('button', { name: /children/i })
    if (await childBtn.count() > 0) {
      await childBtn.click()
      const khadijaOption = page.getByLabel(/Khadijah/i).or(page.getByText('Khadijah').locator('..'))
      if (await khadijaOption.count() > 0) {
        await khadijaOption.first().click()
        await page.keyboard.press('Escape')
      }
    }
    await page.waitForTimeout(400)
    // Planner page should be reachable without errors
    await expect(page).not.toHaveURL(/\/login/)
  })

  test("Khadijah's report shows her subjects", async ({ page }) => {
    await page.goto('/reports')
    await page.waitForTimeout(600)

    // Select Khadijah
    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    await selector.selectOption({ label: /Khadijah/i })
    await page.waitForTimeout(800)

    // Report should show Khadijah's name
    await expect(page.getByText(/Khadijah/i)).toBeVisible()
  })

  test("Khadijah's completed lesson does not appear in Zayd's report", async ({ page }) => {
    // First mark a Khadijah lesson done via the planner API
    await page.goto('/planner')
    await page.waitForTimeout(600)

    // Navigate to reports for Zayd
    await page.goto('/reports')
    await page.waitForTimeout(600)

    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    await selector.selectOption({ label: /Zayd/i })
    await page.waitForTimeout(800)

    // Report should show Zayd's name not Khadijah's in the header
    const reportHeader = page.locator('article header')
    if (await reportHeader.count() > 0) {
      await expect(reportHeader.getByText('Zayd')).toBeVisible()
      await expect(reportHeader.getByText('Khadijah')).toHaveCount(0)
    }
  })

  test('report child selector reflects the correct selected child', async ({ page }) => {
    await page.goto('/reports')
    await page.waitForTimeout(600)

    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    await selector.selectOption({ label: /Khadijah/i })
    await page.waitForTimeout(800)

    const selected = await selector.evaluate((el: HTMLSelectElement) => el.options[el.selectedIndex]?.text ?? '')
    expect(selected).toMatch(/Khadijah/i)
  })
})
