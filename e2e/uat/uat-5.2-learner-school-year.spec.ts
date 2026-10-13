import { test, expect, type BrowserContext } from '@playwright/test'
import { api, createProbeLearner, signIn, ProbeLedger } from './helpers'

/**
 * UAT 5.2 — "If the learner can open Settings → School year, try to save a break."
 * Expect: the save is refused.
 *
 * Amir's result (Oct 8, marked pass with a note): "There was no school year so I
 * tried to make one and it said 'Something went wrong. Please try again.'"
 *
 * Two defects behind that note, both client-side (the server refuses correctly):
 *  1. The learner may not READ school years, the tab treats that 403 as "none
 *     exist", and shows "No active school year yet. Create one below." + the form.
 *  2. Saving the form throws away the server's refusal message.
 */

const READ_DENIED = 'Learners do not have access to this information.'
const WRITE_DENIED = 'Learners are not allowed to make this change.'

let ownerCtx: BrowserContext
let learnerCtx: BrowserContext
const ledger = new ProbeLedger()

test.beforeAll(async ({ browser, baseURL }) => {
  ownerCtx = await browser.newContext({ baseURL })
  await signIn(ownerCtx, baseURL!)

  // Precondition: the household HAS an active school year — so "No active school
  // year yet" shown to the learner is wrong, not just unhelpful.
  const year = await api(ownerCtx.request, '/api/school-years/active')
  expect(year.body?.data, 'owner sees an active school year on dev').toBeTruthy()

  const probe = await createProbeLearner(ownerCtx.request, { withLogin: true })
  ledger.learnerIds.push(probe.id)

  learnerCtx = await browser.newContext({ baseURL })
  const me = await signIn(learnerCtx, baseURL!, probe.email)
  expect(me.email).toBe(probe.email)
})

test.afterAll(async () => {
  await learnerCtx?.close()
  if (ownerCtx) await ledger.cleanup(ownerCtx.request)
  await ownerCtx?.close()
})

test('server contract: learner school-year read and create are refused with the policy messages', async () => {
  const read = await api(learnerCtx.request, '/api/school-years/active')
  expect(read.status).toBe(403)
  expect(read.body?.message).toBe(READ_DENIED)

  const create = await api(learnerCtx.request, '/api/school-years', 'POST', {
    name: 'ZZ UAT Year', startDate: '2026-08-01', endDate: '2027-05-31', isActive: true,
  })
  expect(create.status).toBe(403)
  expect(create.body?.message).toBe(WRITE_DENIED)
})

test('5.2 — learner opens Settings → School year: told they lack access, not "No active school year yet"', async () => {
  const page = await learnerCtx.newPage()
  await page.goto('/settings')
  await page.getByRole('tab', { name: 'School year' }).click()

  const panel = page.getByTestId('settings-panel-school-year')
  await expect(panel).toBeVisible()
  await expect(panel.getByText(READ_DENIED)).toBeVisible()
  await expect(panel.getByText(/no active school year yet/i)).toHaveCount(0)
  // Nothing to create from a year the learner could not read.
  await expect(panel.getByLabel(/school year name/i)).toHaveCount(0)
  await page.close()
})

test('5.2 — Amir\'s exact steps: fill in the school year form and save', async () => {
  const page = await learnerCtx.newPage()
  await page.goto('/settings')
  await page.getByRole('tab', { name: 'School year' }).click()
  const panel = page.getByTestId('settings-panel-school-year')
  await expect(panel).toBeVisible()
  await expect(panel.getByText(/loading school year/i)).toHaveCount(0)

  const nameField = panel.getByLabel(/school year name/i)
  test.skip((await nameField.count()) === 0, 'The form is no longer offered to learners — covered by the previous test.')

  const posted = page.waitForResponse(r => r.url().endsWith('/api/school-years') && r.request().method() === 'POST')
  await nameField.fill('ZZ UAT Year')
  await panel.getByRole('button', { name: /save/i }).click()
  expect((await posted).status()).toBe(403)

  await expect(panel.getByText(WRITE_DENIED)).toBeVisible()
  await expect(panel.getByText(/something went wrong/i)).toHaveCount(0)
  await page.close()
})
