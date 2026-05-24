import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Admin metrics page', () => {
  test('signed-out visit to /admin/metrics redirects to login', async ({ page }) => {
    await page.goto('/admin/metrics')
    await expect(page).toHaveURL(/\/login/)
  })

  test('signed-out API returns 401 JSON', async ({ request }) => {
    const res = await request.get('/api/admin/metrics/summary')
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.status).toBe('error')
  })

  test('dev user sees metrics or forbidden depending on ADMIN_EMAIL', async ({ page }) => {
    await loginDev(page)
    await page.goto('/admin/metrics')
    await expect(page).not.toHaveURL(/\/login/)
    const forbidden = page.getByTestId('admin-page-forbidden')
    const dashboard = page.getByTestId('admin-metrics-dashboard')
    await expect(forbidden.or(dashboard)).toBeVisible({ timeout: 15_000 })
  })
})
