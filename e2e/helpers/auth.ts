import type { Page } from '@playwright/test'

const BYPASS_SECRET = process.env.DEV_BYPASS_SECRET ?? 'dev2026'

/**
 * Sign in via the dev bypass form.
 * Requires the dev server to be running with:
 *   NEXT_PUBLIC_DEV_MODE=true
 *   DEV_BYPASS_SECRET=<secret>
 *   AUTH_SECRET=<any value>
 */
export async function loginDev(page: Page, callbackUrl = '/') {
  const q =
    callbackUrl && callbackUrl !== '/'
      ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : ''
  await page.goto(`/login${q}`)
  const tokenInput = page.getByLabel('Dev bypass token')
  await tokenInput.fill(BYPASS_SECRET)
  await tokenInput.press('Enter')
  await page.waitForURL(
    url =>
      !url.pathname.startsWith('/login') &&
      (callbackUrl === '/' || url.pathname === callbackUrl || url.pathname.startsWith(callbackUrl)),
    { timeout: 10_000 },
  )
}
