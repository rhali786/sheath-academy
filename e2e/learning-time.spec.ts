import { test, expect, type Page } from '@playwright/test'
import { loginDev } from './helpers/auth'

/**
 * Drives the NowCard back to its idle state from whatever state it is
 * currently in. Demo data persists across e2e runs, so a learner may carry
 * an in-progress/draft/ended session left over from a previous run.
 */
async function ensureIdle(page: Page) {
  for (let i = 0; i < 8; i++) {
    if (await page.getByTestId('now-card-idle').isVisible()) return

    if (await page.getByTestId('now-card-finalized').isVisible()) {
      await page.getByTestId('start-another-button').click()
    } else if (await page.getByTestId('now-card-ended').isVisible()) {
      await page.getByTestId('save-outcome-button').click()
    } else if (
      (await page.getByTestId('now-card-running').isVisible()) ||
      (await page.getByTestId('now-card-paused').isVisible())
    ) {
      await page.getByTestId('finish-button').click()
    } else if (await page.getByTestId('now-card-config').isVisible()) {
      // A recovered draft session — start it so it can be finished/finalized.
      await page.getByTestId('start-button').click()
    }

    await page.waitForTimeout(400)
  }
}

function parseElapsed(text: string | null): number {
  const parts = (text ?? '0:00').split(':').map(n => parseInt(n, 10))
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
}

test.describe('Learning Time — session flow (Wave 5 Phase 1)', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page)
    await page.goto('/')
    await page.waitForTimeout(800)
  })

  test('start, pause, resume, finish and finalize a Timer session from the dashboard', async ({ page }) => {
    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    await selector.selectOption({ label: /Zayd/i })
    await page.waitForTimeout(600)

    const link = page.getByTestId('learning-time-link')
    await expect(link).toBeVisible()
    await link.click()
    await page.waitForURL(/\/learning-time/)

    await expect(page.getByTestId('now-card')).toBeVisible()
    await page.waitForTimeout(500)
    await ensureIdle(page)

    // Idle -> configure a Timer session
    await expect(page.getByTestId('now-card-idle')).toBeVisible()
    await page.getByTestId('start-session-button').click()

    await expect(page.getByTestId('now-card-config')).toBeVisible()
    await page.getByTestId('channel-timer').check()
    await page.getByTestId('target-minutes-input').fill('25')
    await page.getByTestId('start-button').click()

    // Running
    await expect(page.getByTestId('now-card-running')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('elapsed-time')).toBeVisible()

    // Pause / Resume
    await page.getByTestId('pause-button').click()
    await expect(page.getByTestId('now-card-paused')).toBeVisible()

    await page.getByTestId('resume-button').click()
    await expect(page.getByTestId('now-card-running')).toBeVisible()

    // Finish
    await page.getByTestId('finish-button').click()
    await expect(page.getByTestId('now-card-ended')).toBeVisible()

    // Finalize with an outcome and a note
    await page.getByTestId('outcome-partial').check()
    await page.getByTestId('notes-textarea').fill('E2E test session')
    await page.getByTestId('save-outcome-button').click()

    await expect(page.getByTestId('now-card-finalized')).toBeVisible()
    await expect(page.getByText('E2E test session')).toBeVisible()

    // Start another -> back to idle
    await page.getByTestId('start-another-button').click()
    await expect(page.getByTestId('now-card-idle')).toBeVisible()
  })

  test('reloading mid-session restores elapsed time from the server', async ({ page }) => {
    const selector = page.getByRole('combobox').or(page.locator('select')).first()
    await selector.selectOption({ label: /Khadijah/i })
    await page.waitForTimeout(600)

    await page.goto('/learning-time')
    await expect(page.getByTestId('now-card')).toBeVisible()
    await page.waitForTimeout(500)
    await ensureIdle(page)

    // Start a Stopwatch session
    await expect(page.getByTestId('now-card-idle')).toBeVisible()
    await page.getByTestId('start-session-button').click()

    await expect(page.getByTestId('now-card-config')).toBeVisible()
    await page.getByTestId('channel-stopwatch').check()
    await page.getByTestId('start-button').click()
    await expect(page.getByTestId('now-card-running')).toBeVisible({ timeout: 10_000 })

    // Let the live timer accumulate a few seconds before reloading
    await page.waitForTimeout(3000)
    const beforeReload = parseElapsed(await page.getByTestId('elapsed-time').textContent())

    await page.reload()

    // Mid-session reload restores the running session from the server —
    // elapsed time must not reset to zero.
    await expect(page.getByTestId('now-card-running')).toBeVisible({ timeout: 10_000 })
    const afterReload = parseElapsed(await page.getByTestId('elapsed-time').textContent())
    expect(afterReload).toBeGreaterThan(0)
    expect(afterReload).toBeGreaterThanOrEqual(beforeReload - 1)

    // Reload while paused also restores elapsed time, not zero
    await page.getByTestId('pause-button').click()
    await expect(page.getByTestId('now-card-paused')).toBeVisible()
    const pausedElapsed = parseElapsed(await page.getByTestId('elapsed-time').textContent())

    await page.reload()
    await expect(page.getByTestId('now-card-paused')).toBeVisible({ timeout: 10_000 })
    const afterPausedReload = parseElapsed(await page.getByTestId('elapsed-time').textContent())
    expect(afterPausedReload).toBeGreaterThanOrEqual(pausedElapsed)

    // Clean up so the learner returns to idle for future runs
    await page.getByTestId('finish-button').click()
    await expect(page.getByTestId('now-card-ended')).toBeVisible()
    await page.getByTestId('save-outcome-button').click()
    await expect(page.getByTestId('now-card-finalized')).toBeVisible()
  })
})
