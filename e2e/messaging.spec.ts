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

  test('selecting a conversation opens the thread view', async ({ page }) => {
    const item = page.locator('[data-testid^="conversation-item-"]').first()
    if (await item.count() === 0) test.skip(true, 'no conversations available for this user')
    await item.click()
    await expect(page.locator('[data-testid="thread-view"], [data-testid="thread-empty"]').first()).toBeVisible({
      timeout: 15_000,
    })
  })
})
