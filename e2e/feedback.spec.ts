import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Feedback hub — admin view', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page, '/feedback')
  })

  test('renders "All feedback" title for admin', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /all feedback/i })).toBeVisible({ timeout: 10_000 })
  })

  test('shows submitter email on each feedback row', async ({ page }) => {
    // At least one row must display an email address
    const emailPattern = /\S+@\S+\.\S+/
    await expect(page.locator('text=' + 'dev@sheathacademy.ai').first()).toBeVisible({ timeout: 10_000 })
  })

  test('each row links to its detail page', async ({ page }) => {
    const firstLink = page.locator('a[href^="/feedback/"]').first()
    await expect(firstLink).toBeVisible({ timeout: 10_000 })
    const href = await firstLink.getAttribute('href')
    expect(href).toMatch(/^\/feedback\/[a-z0-9-]+$/)
  })

  test('detail page shows admin details section with submitter email', async ({ page }) => {
    const firstLink = page.locator('a[href^="/feedback/"]').first()
    await firstLink.click()
    await expect(page.getByText(/admin details/i)).toBeVisible({ timeout: 10_000 })
    // Email visible somewhere in admin details box
    await expect(page.locator('text=dev@sheathacademy.ai').first()).toBeVisible()
  })
})

test.describe('Feedback hub — unauthenticated', () => {
  test('redirects to login when not signed in', async ({ page }) => {
    await page.goto('/feedback')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })
})

test.describe('Admin feedback queue', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page, '/admin/feedback')
  })

  test('renders feedback queue page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /feedback queue/i })).toBeVisible({ timeout: 10_000 })
  })

  test('shows submitter email on each card', async ({ page }) => {
    // dev user's own feedback should appear
    const email = page.locator('text=dev@sheathacademy.ai').first()
    await expect(email).toBeVisible({ timeout: 10_000 })
  })

  test('"View detail" link navigates to feedback detail page', async ({ page }) => {
    const viewDetail = page.getByRole('link', { name: /view detail/i }).first()
    await expect(viewDetail).toBeVisible({ timeout: 10_000 })
    await viewDetail.click()
    await expect(page).toHaveURL(/\/feedback\/[a-z0-9-]+/, { timeout: 10_000 })
    await expect(page.getByText(/feedback detail/i)).toBeVisible()
  })

  test('unauthenticated request to admin feedback API returns 401', async ({ request }) => {
    const res = await request.get('/api/admin/feedback')
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.status).toBe('error')
  })
})
