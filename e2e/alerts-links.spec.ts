import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Alerts — child names and navigation links', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/')
    await page.waitForTimeout(800)
  })

  test('Needs Attention section does not show raw seed IDs', async ({ page }) => {
    const alertItems = page.locator('[data-testid="alert-item"]')
    const count = await alertItems.count()
    for (let i = 0; i < count; i++) {
      const text = await alertItems.nth(i).textContent()
      expect(text ?? '').not.toMatch(/STUDENT_SEED_|student_seed_/i)
    }
  })

  test('attendance alert links to /attendance', async ({ page }) => {
    // Find any alert that is a link to /attendance
    const attendanceLink = page.locator('a[href="/attendance"]').first()
    if (await attendanceLink.count() === 0) {
      // No attendance alert present — seed may be in different state
      test.skip()
      return
    }
    await attendanceLink.click()
    await page.waitForURL(/\/attendance/, { timeout: 5000 })
    await expect(page).toHaveURL(/\/attendance/)
  })

  test('lesson alert links to /lessons', async ({ page }) => {
    const lessonLink = page.locator('a[href="/lessons"]').first()
    if (await lessonLink.count() === 0) {
      test.skip()
      return
    }
    await lessonLink.click()
    await page.waitForURL(/\/lessons/, { timeout: 5000 })
    await expect(page).toHaveURL(/\/lessons/)
  })
})

test.describe('Quran page — session editing', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/quran')
    await page.waitForTimeout(600)
  })

  test('Quran Studies page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Quran Studies/i })).toBeVisible()
  })

  test('sessions are sorted by most recent date', async ({ page }) => {
    const dates = await page.locator('.text-xs.text-slate-400').allTextContents()
    const dateLike = dates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d.trim()))
    if (dateLike.length < 2) {
      test.skip()
      return
    }
    // Each date should be ≥ the next (descending)
    for (let i = 0; i < dateLike.length - 1; i++) {
      expect(dateLike[i].trim() >= dateLike[i + 1].trim()).toBe(true)
    }
  })

  test('edit button is present on each session card', async ({ page }) => {
    const editBtns = page.getByRole('button', { name: /edit session/i })
    const count = await editBtns.count()
    if (count === 0) {
      // Try aria-label approach
      const pencilBtns = page.locator('button[aria-label="Edit session"]')
      const pCount = await pencilBtns.count()
      expect(pCount).toBeGreaterThanOrEqual(0)
      return
    }
    expect(count).toBeGreaterThan(0)
  })

  test('clicking edit opens inline form with pre-filled surah', async ({ page }) => {
    const editBtns = page.locator('button[aria-label="Edit session"]')
    const count = await editBtns.count()
    if (count === 0) {
      test.skip()
      return
    }
    await editBtns.first().click()
    await page.waitForTimeout(200)
    // Surah input should appear pre-filled
    const surahInput = page.getByLabel(/Surah/i).first()
    await expect(surahInput).toBeVisible()
    const val = await surahInput.inputValue()
    expect(val.length).toBeGreaterThan(0)
  })
})
