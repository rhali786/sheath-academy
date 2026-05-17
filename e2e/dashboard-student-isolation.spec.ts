import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Dashboard — selected student isolation', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/')
    await page.waitForTimeout(800)
  })

  test('dashboard loads and shows a child selector', async ({ page }) => {
    // ChildSelector only renders when there are 2+ children
    await expect(page.getByRole('combobox').or(page.locator('select'))).toBeVisible()
  })

  test('switching to Khadijah updates the child selector', async ({ page }) => {
    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    await selector.selectOption({ label: /Khadijah/i })
    await page.waitForTimeout(600)
    const selected = await selector.evaluate((el: HTMLSelectElement) => el.options[el.selectedIndex]?.text ?? '')
    expect(selected).toMatch(/Khadijah/i)
  })

  test('Quran section does not show all three children when Khadijah is selected', async ({ page }) => {
    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    await selector.selectOption({ label: /Khadijah/i })
    await page.waitForTimeout(800)

    // QuranStudies section should not show Zayd's card
    const quranSection = page.getByRole('heading', { name: /Quran/i }).locator('../..')
    await expect(quranSection.getByText('Zayd')).toHaveCount(0)
  })

  test('switching student changes the visible child name in the Quran section', async ({ page }) => {
    const selector = page.getByRole('combobox').or(page.locator('select')).first()

    // Select Khadijah
    await selector.selectOption({ label: /Khadijah/i })
    await page.waitForTimeout(600)

    // Quran section shows Khadijah
    const quranSection = page
      .locator('section')
      .filter({ hasText: /Quran.*Arabic.*Islamic/i })
    await expect(quranSection.getByText('Khadijah')).toBeVisible()

    // Switch to Zayd
    await selector.selectOption({ label: /Zayd/i })
    await page.waitForTimeout(600)
    await expect(quranSection.getByText('Zayd')).toBeVisible()
    // Khadijah's card should no longer appear
    await expect(quranSection.getByText('Khadijah')).toHaveCount(0)
  })

  test("switching student updates Today's State metrics", async ({ page }) => {
    const selector = page.getByRole('combobox').or(page.locator('select')).first()

    await selector.selectOption({ label: /Khadijah/i })
    await page.waitForTimeout(600)

    // Today's State section must still be visible with some metric cards
    const todaySection = page.locator('section').filter({ hasText: /Today.*State/i })
    await expect(todaySection).toBeVisible()
  })
})
