import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Product validation feedback', () => {
  test('signed-out user sees sign-in required on /feedback', async ({ page }) => {
    await page.goto('/feedback')
    await expect(page.getByTestId('feedback-sign-in-required')).toBeVisible()
    await expect(page.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      /callbackUrl=%2Ffeedback/,
    )
  })

  test('about page links to feedback form', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByTestId('about-feedback-cta')).toHaveAttribute('href', '/feedback')
  })

  test('signed-in user can open wizard from about CTA', async ({ page }) => {
    await loginDev(page)
    await page.goto('/about')
    await page.getByTestId('about-feedback-cta').click()
    await expect(page).toHaveURL(/\/feedback/)
    await expect(page.getByTestId('product-validation-wizard')).toBeVisible()
    await expect(page.getByText(/step 1 of 6/i)).toBeVisible()
  })

  test('non-admin cannot load validation summary API', async ({ page, request }) => {
    await loginDev(page)
    const res = await request.get('/api/product-validation/summary')
    expect([403, 401]).toContain(res.status())
  })
})
