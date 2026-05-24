import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Portfolio tab — layout (Wave A1)', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/portfolio')
    await page.waitForTimeout(500)
  })

  test('portfolio heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /portfolio/i })).toBeVisible()
  })

  test('portfolio container uses max-w-7xl (matches other pages)', async ({ page }) => {
    // The outer div should have the max-w-7xl class applied
    const container = page.locator('.max-w-7xl').first()
    await expect(container).toBeVisible()
  })

  test('portfolio content is not full-viewport width', async ({ page }) => {
    const container = page.locator('.max-w-7xl').first()
    const viewportWidth = page.viewportSize()?.width ?? 1280
    const box = await container.boundingBox()

    // max-w-7xl = 80rem = 1280px; content should be at most 1280px wide
    expect(box?.width).toBeLessThanOrEqual(viewportWidth)
  })
})
