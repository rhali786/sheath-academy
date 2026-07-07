import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Authentication enforcement', () => {
  test('/about is reachable without signing in', async ({ page }) => {
    await page.goto('/about')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByText(/Built for this family/i)).toBeVisible()
  })

  test('/login is reachable without signing in', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)
  })

  test('/ is reachable without signing in (public landing page)', async ({ page }) => {
    await page.goto('/')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /the school they built at home/i })).toBeVisible()
  })

  test('/reports redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/reports')
    await expect(page).toHaveURL(/\/login/)
  })

  test('/lessons redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/lessons')
    await expect(page).toHaveURL(/\/login/)
  })

  test('/attendance redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/attendance')
    await expect(page).toHaveURL(/\/login/)
  })

  test('dev bypass signs in and reaches the dashboard', async ({ page }) => {
    await loginDev(page)
    await expect(page).not.toHaveURL(/\/login/)
  })
})
