import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Dashboard — Islamic calendar (Wave 11)', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/')
    await page.waitForTimeout(500)
  })

  test('Today shows at least one Islamic calendar countdown', async ({ page }) => {
    await expect(page.getByTestId('islamic-calendar-card').first()).toBeVisible()
  })
})
