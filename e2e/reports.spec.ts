import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Reports page — layout and print trigger (Wave A3)', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/reports')
    await page.waitForTimeout(500)
  })

  test('page heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /records summary/i })).toBeVisible()
  })

  test('child selector is present', async ({ page }) => {
    await expect(page.getByRole('combobox')).toBeVisible()
  })

  test('Print records button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /print records/i })).toBeVisible()
  })

  test('report content renders inside max-w-7xl container', async ({ page }) => {
    const container = page.locator('.max-w-7xl').first()
    await expect(container).toBeVisible()
  })

  test('report content is not full viewport width', async ({ page }) => {
    const container = page.locator('.max-w-7xl').first()
    const viewportWidth = page.viewportSize()?.width ?? 1280
    const box = await container.boundingBox()
    expect(box?.width).toBeLessThanOrEqual(viewportWidth)
  })
})
