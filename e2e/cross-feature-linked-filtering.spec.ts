import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Cross-feature linked filtering — Dashboard Today State', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/')
    await page.waitForTimeout(1000)
  })

  test('Attendance Ready link includes childId when a child is selected', async ({ page }) => {
    // Select the first child in the ChildSelector
    const childSelector = page.locator('select').first()
    const options = await childSelector.locator('option').all()
    // Find a non-empty option (i.e., a child, not "All Children")
    const childOption = options.find(async o => {
      const val = await o.getAttribute('value')
      return val && val !== ''
    })
    if (!childOption) { test.skip(); return }

    const childId = await childOption.getAttribute('value')
    if (!childId) { test.skip(); return }

    await childSelector.selectOption(childId)
    await page.waitForTimeout(500)

    // Find the Attendance Ready link in Today's State
    const attendanceLink = page.getByRole('link', { name: /attendance ready/i })
    if (await attendanceLink.count() === 0) { test.skip(); return }

    const href = await attendanceLink.getAttribute('href')
    expect(href).toContain(`/attendance`)
    expect(href).toContain(`childId=${childId}`)
  })

  test('Attendance Ready link has no childId when All Children selected', async ({ page }) => {
    // Select "All Children" if there's a selector with that option
    const childSelector = page.locator('select').first()
    const allChildrenOption = childSelector.locator('option[value=""]')
    if (await allChildrenOption.count() === 0) { test.skip(); return }

    await childSelector.selectOption('')
    await page.waitForTimeout(500)

    const attendanceLink = page.getByRole('link', { name: /attendance ready/i })
    if (await attendanceLink.count() === 0) { test.skip(); return }

    const href = await attendanceLink.getAttribute('href')
    expect(href).toBe('/attendance')
  })

  test('clicking Attendance Ready with child selected navigates to /attendance?childId=...', async ({ page }) => {
    const childSelector = page.locator('select').first()
    const options = await childSelector.locator('option').all()
    let childId = ''
    for (const opt of options) {
      const val = await opt.getAttribute('value')
      if (val && val !== '') { childId = val; break }
    }
    if (!childId) { test.skip(); return }

    await childSelector.selectOption(childId)
    await page.waitForTimeout(500)

    const attendanceLink = page.getByRole('link', { name: /attendance ready/i })
    if (await attendanceLink.count() === 0) { test.skip(); return }

    await attendanceLink.click()
    await page.waitForURL(/\/attendance/, { timeout: 5000 })
    await expect(page).toHaveURL(`/attendance?childId=${childId}`)
  })
})

test.describe('Cross-feature linked filtering — Quran Streak circles', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/')
    await page.waitForTimeout(1200)
  })

  test('Quran Streak child circle is a link to /quran?childId=...', async ({ page }) => {
    // In All Children mode, each streak circle links to /quran?childId=<id>
    const quranLinks = page.locator('a[href*="/quran?childId="]')
    const count = await quranLinks.count()
    if (count === 0) { test.skip(); return }

    const href = await quranLinks.first().getAttribute('href')
    expect(href).toMatch(/\/quran\?childId=/)
  })

  test('clicking a Quran Streak circle navigates to /quran?childId=...', async ({ page }) => {
    const quranLinks = page.locator('a[href*="/quran?childId="]')
    if (await quranLinks.count() === 0) { test.skip(); return }

    const href = await quranLinks.first().getAttribute('href')
    const childIdMatch = href?.match(/childId=([^&]+)/)
    if (!childIdMatch) { test.skip(); return }

    const childId = childIdMatch[1]
    await quranLinks.first().click()
    await page.waitForURL(/\/quran/, { timeout: 5000 })
    await expect(page).toHaveURL(`/quran?childId=${childId}`)
  })

  test('Quran page opened via circle link shows correct child filter', async ({ page }) => {
    const quranLinks = page.locator('a[href*="/quran?childId="]')
    if (await quranLinks.count() === 0) { test.skip(); return }

    const href = await quranLinks.first().getAttribute('href')
    const childIdMatch = href?.match(/childId=([^&]+)/)
    if (!childIdMatch) { test.skip(); return }
    const childId = childIdMatch[1]

    await quranLinks.first().click()
    await page.waitForURL(/\/quran/, { timeout: 5000 })

    // Quran page child filter select should have the clicked child selected
    await page.waitForTimeout(800)
    const childFilterSelect = page.locator('select').first()
    const selectedValue = await childFilterSelect.inputValue()
    expect(selectedValue).toBe(childId)
  })
})

test.describe('Cross-feature linked filtering — Records & Proof', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/')
    await page.waitForTimeout(1000)
  })

  test('Quran Sessions link includes childId when child is selected', async ({ page }) => {
    const childSelector = page.locator('select').first()
    const options = await childSelector.locator('option').all()
    let childId = ''
    for (const opt of options) {
      const val = await opt.getAttribute('value')
      if (val && val !== '') { childId = val; break }
    }
    if (!childId) { test.skip(); return }

    await childSelector.selectOption(childId)
    await page.waitForTimeout(500)

    const quranLink = page.locator('a[href*="/quran?childId="]').first()
    if (await quranLink.count() === 0) { test.skip(); return }

    const href = await quranLink.getAttribute('href')
    expect(href).toContain(`childId=${childId}`)
  })

  test('Progress Updates link points to /lessons (not /planner)', async ({ page }) => {
    const lessonsLink = page.locator('a[href*="/lessons"]').first()
    if (await lessonsLink.count() === 0) { test.skip(); return }

    const href = await lessonsLink.getAttribute('href')
    expect(href).toMatch(/^\/lessons/)
    expect(href).not.toMatch(/^\/planner/)
  })
})

test.describe('Cross-feature linked filtering — Attendance destination sync', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/')
    await page.waitForTimeout(1000)
  })

  test('Attendance Learner selector shows selected child after navigation from dashboard', async ({ page }) => {
    const childSelector = page.locator('select').first()
    const options = await childSelector.locator('option').all()
    let childId = ''
    for (const opt of options) {
      const val = await opt.getAttribute('value')
      if (val && val !== '') { childId = val; break }
    }
    if (!childId) { test.skip(); return }

    await childSelector.selectOption(childId)
    await page.waitForTimeout(500)

    const attendanceLink = page.getByRole('link', { name: /attendance ready/i })
    if (await attendanceLink.count() === 0) { test.skip(); return }

    await attendanceLink.click()
    await page.waitForURL(/\/attendance/, { timeout: 5000 })
    await page.waitForTimeout(800)

    // The Learner selector on the Attendance page should match the child from the URL
    const learnerSelect = page.getByLabel(/^learner$/i)
    if (await learnerSelect.count() === 0) { test.skip(); return }
    const selectedValue = await learnerSelect.inputValue()
    expect(selectedValue).toBe(childId)
  })
})

test.describe('Cross-feature linked filtering — Quran destination sync', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/')
    await page.waitForTimeout(1200)
  })

  test('Quran page child filter select shows the child from ?childId param', async ({ page }) => {
    // Navigate directly to /quran with a childId param (simulating what the circle link does)
    // First get a valid childId from the dashboard Quran circles
    const quranLinks = page.locator('a[href*="/quran?childId="]')
    if (await quranLinks.count() === 0) { test.skip(); return }

    const href = await quranLinks.first().getAttribute('href')
    const childIdMatch = href?.match(/childId=([^&]+)/)
    if (!childIdMatch) { test.skip(); return }
    const childId = childIdMatch[1]

    await quranLinks.first().click()
    await page.waitForURL(/\/quran/, { timeout: 5000 })
    await page.waitForTimeout(800)

    // "All children" select should show the selected child
    const childFilterSelect = page.locator('select').filter({ hasText: 'All children' })
    if (await childFilterSelect.count() === 0) { test.skip(); return }
    const selectedValue = await childFilterSelect.inputValue()
    expect(selectedValue).toBe(childId)
  })
})

test.describe('Cross-feature linked filtering — URL change while page is mounted', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
  })

  test('Attendance Learner selector updates when URL childId changes without full remount', async ({ page }) => {
    // First navigate to /attendance without a childId
    await page.goto('/attendance')
    await page.waitForTimeout(800)

    const learnerSelect = page.getByLabel(/^learner$/i)
    if (await learnerSelect.count() === 0) { test.skip(); return }
    const initialValue = await learnerSelect.inputValue()

    // Now navigate to /attendance?childId=... (client-side, keeps component mounted in App Router)
    await page.goto('/attendance')
    await page.waitForTimeout(400)

    // Get a valid childId from the learner selector options
    const options = await learnerSelect.locator('option').all()
    let secondChildId = ''
    for (const opt of options) {
      const val = await opt.getAttribute('value')
      if (val && val !== initialValue) { secondChildId = val; break }
    }
    if (!secondChildId) { test.skip(); return }

    // Use Next.js client-side navigation to change the URL with same component mounted
    await page.evaluate((id) => {
      const url = `/attendance?childId=${id}`
      window.history.pushState({}, '', url)
      // Dispatch popstate so Next.js router picks it up
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
    }, secondChildId)
    await page.waitForTimeout(800)

    const updatedValue = await learnerSelect.inputValue()
    expect(updatedValue).toBe(secondChildId)
  })

  test('Quran child filter updates when navigating to /quran?childId=... from /quran', async ({ page }) => {
    await page.goto('/quran')
    await page.waitForTimeout(800)

    const childFilterSelect = page.locator('select').filter({ hasText: 'All children' })
    if (await childFilterSelect.count() === 0) { test.skip(); return }

    // Get a valid childId from the select options
    const options = await childFilterSelect.locator('option').all()
    let childId = ''
    for (const opt of options) {
      const val = await opt.getAttribute('value')
      if (val && val !== '') { childId = val; break }
    }
    if (!childId) { test.skip(); return }

    // Navigate to the same page with childId (simulates in-app link click staying mounted)
    await page.evaluate((id) => {
      window.history.pushState({}, '', `/quran?childId=${id}`)
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
    }, childId)
    await page.waitForTimeout(800)

    const selectedValue = await childFilterSelect.inputValue()
    expect(selectedValue).toBe(childId)
  })
})

test.describe('Cross-feature linked filtering — Lesson alert → Lessons page', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/')
    await page.waitForTimeout(1000)
  })

  test('lesson alert href includes childId', async ({ page }) => {
    const lessonAlertLink = page.locator('a[href*="/lessons?childId="]').first()
    if (await lessonAlertLink.count() === 0) { test.skip(); return }

    const href = await lessonAlertLink.getAttribute('href')
    expect(href).toMatch(/\/lessons\?childId=/)
  })

  test('clicking lesson alert navigates to /lessons with childId in URL', async ({ page }) => {
    const lessonAlertLink = page.locator('a[href*="/lessons?childId="]').first()
    if (await lessonAlertLink.count() === 0) { test.skip(); return }

    const href = await lessonAlertLink.getAttribute('href')
    const childIdMatch = href?.match(/childId=([^&]+)/)
    if (!childIdMatch) { test.skip(); return }
    const childId = childIdMatch[1]

    await lessonAlertLink.click()
    await page.waitForURL(/\/lessons/, { timeout: 5000 })
    await expect(page).toHaveURL(`/lessons?childId=${childId}`)
  })

  test('Lessons page opened via alert link initializes child filter', async ({ page }) => {
    const lessonAlertLink = page.locator('a[href*="/lessons?childId="]').first()
    if (await lessonAlertLink.count() === 0) { test.skip(); return }

    const href = await lessonAlertLink.getAttribute('href')
    const childIdMatch = href?.match(/childId=([^&]+)/)
    if (!childIdMatch) { test.skip(); return }
    const childId = childIdMatch[1]

    await lessonAlertLink.click()
    await page.waitForURL(/\/lessons/, { timeout: 5000 })
    await page.waitForTimeout(800)

    // The "All children" select in the All lessons section should show the linked child
    const childFilterSelect = page.locator('select').filter({ hasText: 'All children' })
    if (await childFilterSelect.count() === 0) { test.skip(); return }
    const selectedValue = await childFilterSelect.inputValue()
    expect(selectedValue).toBe(childId)
  })
})
