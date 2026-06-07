import { test, expect } from '@playwright/test'
import { loginDev } from './helpers/auth'

test.describe('Messages page', () => {
  test.beforeEach(async ({ page }) => {
    await loginDev(page, '/messages')
  })

  test('loads without a client-side crash and renders the conversation list', async ({ page }) => {
    await expect(page.getByText(/application error/i)).toHaveCount(0)
    const list = page.locator(
      '[data-testid="conversation-list"], [data-testid="conversation-list-empty"], [data-testid="conversation-list-error"]'
    )
    await expect(list.first()).toBeVisible({ timeout: 15_000 })
  })

  test('starting a direct conversation with a household member succeeds (no group-conversation error)', async ({ page }) => {
    await page.getByRole('button', { name: /new message/i }).click()
    const dialog = page.getByRole('dialog', { name: /new message/i })
    await expect(dialog).toBeVisible()

    const radio = dialog.locator('input[type="radio"][name="member"]').first()
    if (await radio.count() === 0) test.skip(true, 'no other household members available for this user')
    await radio.check()
    await dialog.getByRole('button', { name: /start conversation/i }).click()

    await expect(dialog.getByText(/group conversations require/i)).toHaveCount(0)
    await expect(dialog).toBeHidden({ timeout: 15_000 })
  })

  test('selecting a conversation opens the thread view', async ({ page }) => {
    const item = page.locator('[data-testid^="conversation-item-"]').first()
    if (await item.count() === 0) test.skip(true, 'no conversations available for this user')
    await item.click()
    await expect(page.locator('[data-testid="thread-view"], [data-testid="thread-empty"]').first()).toBeVisible({
      timeout: 15_000,
    })
  })
})
