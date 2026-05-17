import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

function tomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function yesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

test.describe('Reports — date validation', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/reports')
    await page.waitForTimeout(500)
  })

  test('end date input has a max attribute capped at today', async ({ page }) => {
    const endInput = page.getByLabel(/end date/i)
    const max = await endInput.getAttribute('max')
    expect(max).toBe(today())
  })

  test('start date input has a max attribute capped at today', async ({ page }) => {
    const startInput = page.getByLabel(/start date/i)
    const max = await startInput.getAttribute('max')
    expect(max).toBe(today())
  })

  test('setting end date to tomorrow shows a validation error', async ({ page }) => {
    const endInput = page.getByLabel(/end date/i)
    // Use evaluate to bypass the max attribute and force-set a future date
    await endInput.evaluate((el: HTMLInputElement, val) => { el.value = val }, tomorrow())
    await endInput.dispatchEvent('input')
    await endInput.dispatchEvent('change')
    await page.waitForTimeout(300)

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('alert')).toContainText(/future|cannot/i)
  })

  test('setting start date to tomorrow shows a validation error', async ({ page }) => {
    const startInput = page.getByLabel(/start date/i)
    await startInput.evaluate((el: HTMLInputElement, val) => { el.value = val }, tomorrow())
    await startInput.dispatchEvent('input')
    await startInput.dispatchEvent('change')
    await page.waitForTimeout(300)

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('alert')).toContainText(/future|cannot/i)
  })

  test('start date after end date shows a validation error', async ({ page }) => {
    const startInput = page.getByLabel(/start date/i)
    const endInput = page.getByLabel(/end date/i)

    // Set end date to yesterday, start date to today (start > end)
    await endInput.fill(yesterday())
    await startInput.fill(today())
    await page.waitForTimeout(300)

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('alert')).toContainText(/start date|end date/i)
  })

  test('valid date range (past to today) shows no validation error', async ({ page }) => {
    const startInput = page.getByLabel(/start date/i)
    const endInput = page.getByLabel(/end date/i)

    await startInput.fill(yesterday())
    await endInput.fill(today())
    await page.waitForTimeout(300)

    await expect(page.getByRole('alert')).toHaveCount(0)
  })
})
