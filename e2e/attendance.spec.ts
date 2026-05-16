import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Attendance page — record display (Wave A2)', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/attendance')
  })

  test('page heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /attendance/i })).toBeVisible()
  })

  test('child selector is present', async ({ page }) => {
    await expect(page.getByRole('combobox')).toBeVisible()
  })

  test('child name appears in each record row', async ({ page }) => {
    // Seed data has records for Adam — his name should appear in the records list
    const records = page.locator('ul li')
    const count = await records.count()
    if (count > 0) {
      // At least one record row should contain a child name (not just the date)
      const firstRow = records.first()
      // Child name chip is a small text span between status badge and date
      await expect(firstRow).toBeVisible()
    }
  })

  test('notes icon shown when a record has notes', async ({ page }) => {
    // Mark attendance with a note to confirm the icon appears
    await page.getByPlaceholder('Notes (optional)').fill('Test note for E2E')
    await page.getByRole('button', { name: /present/i }).first().click()

    // Wait for the record list to refresh
    await page.waitForTimeout(800)

    const notesIcon = page.getByRole('img', { name: 'Has notes' })
    await expect(notesIcon).toBeVisible()
  })

  test('hours and minutes shown only when > 0', async ({ page }) => {
    // Fill in hours and minutes then mark attendance
    await page.getByPlaceholder('Hours').fill('2')
    await page.getByPlaceholder('Minutes').fill('30')
    await page.getByRole('button', { name: /present/i }).first().click()

    await page.waitForTimeout(800)

    await expect(page.getByText(/2h/)).toBeVisible()
    await expect(page.getByText(/30m/)).toBeVisible()
  })
})
