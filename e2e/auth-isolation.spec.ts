import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Auth isolation', () => {
  test('signed-out visit to / is reachable (public landing page)', async ({ page }) => {
    await page.goto('/')
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('signed-out API call returns 401 JSON', async ({ request }) => {
    const res = await request.get('/api/dashboard/summary')
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.status).toBe('error')
    expect(body.data).toBeNull()
  })

  test('dev bypass reaches dashboard', async ({ page }) => {
    await loginDev(page)
    await expect(page).not.toHaveURL(/\/login/)
  })
})
