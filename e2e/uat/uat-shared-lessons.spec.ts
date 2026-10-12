import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import { api, createProbeLearner, selectLearner, signIn, timelineRow, ProbeLedger, ALL_DAYS } from './helpers'

/**
 * Shared-lessons batch (docs/bug_enhancement/20261012-shared-lessons-plan.md), against dev.
 *
 * Every step checks what the parent SEES and, where it matters, what was STORED — the
 * last round's specs only checked the API, which is how UAT 3.8 (a saved time not showing
 * until reload) slipped through. Three throwaway "ZZ UAT Probe" learners, each with their
 * own course; every lesson is created here and deleted afterwards. Each test creates the
 * lessons it needs, so a failure never cascades.
 */

let ctx: BrowserContext
let page: Page
const ledger = new ProbeLedger()
const s = {
  today: '', tomorrow: '', todayName: '', tomorrowName: '',
  learners: [] as { id: string; name: string; email: string; courseId: string }[],
}

function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

async function lessonById(id: string) {
  return (await api(ctx.request, `/api/plan/lessons/${id}`)).body?.data
}

/** One lesson for each given learner (2+ = a shared lesson). Returns the copy ids in learner order. */
async function createLesson(title: string, learnerIdx: number[], extra: Record<string, unknown> = {}) {
  const ls = learnerIdx.map(i => s.learners[i])
  const body = ls.length > 1
    ? { childIds: ls.map(l => l.id), assignments: ls.map(l => ({ childId: l.id, subjectId: l.courseId })), subjectId: ls[0].courseId }
    : { childId: ls[0].id, subjectId: ls[0].courseId }
  const res = await api(ctx.request, '/api/plan/lessons', 'POST', { title, dueDate: s.today, estimatedDuration: '30min', ...body, ...extra })
  expect(res.status, `create "${title}": ${res.body?.message}`).toBe(201)
  const all = (await api(ctx.request, `/api/plan/lessons?childIds=${ls.map(l => l.id).join(',')}`)).body!.data as { id: string; title: string; childId: string }[]
  const ids = ls.map(l => all.find(x => x.title === title && x.childId === l.id)!.id)
  ledger.lessonIds.push(...ids)
  return ids
}

async function openCalendarWindow(title: string) {
  await page.goto(`/plan/schedule?date=${s.today}&view=day`)
  const row = timelineRow(page, title)
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Edit lesson' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit lesson' })
  await expect(dialog.getByLabel('Title', { exact: true })).toBeVisible()
  return dialog
}

test.beforeAll(async ({ browser, baseURL }) => {
  ctx = await browser.newContext({ baseURL })
  await signIn(ctx, baseURL!)
  s.today = new Date().toISOString().slice(0, 10)
  s.tomorrow = addDays(s.today, 1)
  s.todayName = ALL_DAYS[new Date(`${s.today}T00:00:00Z`).getUTCDay()]
  s.tomorrowName = ALL_DAYS[new Date(`${s.tomorrow}T00:00:00Z`).getUTCDay()]
  for (let i = 0; i < 3; i++) {
    const p = await createProbeLearner(ctx.request, { withLogin: i === 0 })
    ledger.learnerIds.push(p.id)
    // Course time on TODAY's weekday only, so tomorrow exercises the "no set time" hint.
    const c = await api(ctx.request, '/api/subjects', 'POST', {
      name: `ZZ UAT SL Math ${i + 1}`, category: 'Math', learnerIds: [p.id],
      recurringSchedule: [{ daysOfWeek: [s.todayName], startTime: '10:15', endTime: '11:00' }],
    })
    expect(c.status, `create course: ${c.body?.message}`).toBeLessThan(300)
    ledger.courseIds.push(c.body!.data.id)
    s.learners.push({ ...p, courseId: c.body!.data.id })
  }
  page = await ctx.newPage()
})

test.afterAll(async () => {
  if (ctx) {
    // Lessons the tests already deleted would make cleanup report 404s; keep only live ones.
    const live: string[] = []
    for (const id of ledger.lessonIds) if ((await api(ctx.request, `/api/plan/lessons/${id}`)).status === 200) live.push(id)
    ledger.lessonIds = live
    await ledger.cleanup(ctx.request)
  }
  await ctx?.close()
})

// ── 1. Edit in place (Calendar, Planner, Dashboard, old links) ────────────────

test('1.1 Calendar pencil opens the Edit lesson window over the Calendar', async () => {
  await createLesson('ZZ SL 1.1', [0])
  await openCalendarWindow('ZZ SL 1.1')
  await expect(page).toHaveURL(/\/plan\/schedule/)
})

test('1.2 Escape closes the window without saving', async () => {
  const [id] = await createLesson('ZZ SL 1.2', [0])
  const dialog = await openCalendarWindow('ZZ SL 1.2')
  await dialog.getByLabel('Title', { exact: true }).fill('ZZ SL 1.2 NOT SAVED')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  expect((await lessonById(id)).title).toBe('ZZ SL 1.2')
})

test('1.3 A rename shows on the Calendar right after Save (no reload)', async () => {
  const [id] = await createLesson('ZZ SL 1.3', [0])
  const dialog = await openCalendarWindow('ZZ SL 1.3')
  await dialog.getByLabel('Title', { exact: true }).fill('ZZ SL 1.3 renamed')
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(timelineRow(page, 'ZZ SL 1.3 renamed')).toBeVisible()
  expect((await lessonById(id)).title).toBe('ZZ SL 1.3 renamed')
})

test('1.4 UAT 3.8 — Dashboard: a new time shows in Today\'s Schedule without a reload, and clearing it goes back to the course time', async () => {
  await createLesson('ZZ SL 1.4', [1])
  await page.goto('/dashboard')
  await selectLearner(page, s.learners[1].name)
  await expect(timelineRow(page, 'ZZ SL 1.4')).toContainText('10:15 AM')

  await timelineRow(page, 'ZZ SL 1.4').getByRole('button', { name: 'Edit lesson' }).click()
  let dialog = page.getByRole('dialog', { name: 'Edit lesson' })
  await dialog.getByLabel('Start time hour').selectOption('1')
  await dialog.getByLabel('Start time period').selectOption('PM')
  await dialog.getByLabel('End time hour').selectOption('1')
  await dialog.getByLabel('End time minute').selectOption('30')
  await dialog.getByLabel('End time period').selectOption('PM')
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(timelineRow(page, 'ZZ SL 1.4')).toContainText('1:00 PM')

  await timelineRow(page, 'ZZ SL 1.4').getByRole('button', { name: 'Edit lesson' }).click()
  dialog = page.getByRole('dialog', { name: 'Edit lesson' })
  await dialog.getByLabel('Start time hour').selectOption('')
  await dialog.getByLabel('End time hour').selectOption('')
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(timelineRow(page, 'ZZ SL 1.4')).toContainText('10:15 AM')
})

test('1.5 Lesson Planner: clicking a lesson opens the window on the Planner and Save shows the change there', async () => {
  const [id] = await createLesson('ZZ SL 1.5', [0])
  await page.goto('/plan')
  await selectLearner(page, s.learners[0].name)
  await page.getByText('ZZ SL 1.5', { exact: true }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Edit lesson' })
  await expect(dialog.getByLabel('Title', { exact: true })).toHaveValue('ZZ SL 1.5')
  await expect(page).toHaveURL(/\/plan(\?|$)/)
  await dialog.getByLabel('Title', { exact: true }).fill('ZZ SL 1.5 renamed')
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('ZZ SL 1.5 renamed', { exact: true }).first()).toBeVisible()
  expect((await lessonById(id)).title).toBe('ZZ SL 1.5 renamed')
})

test('1.6 An old /lessons?editId= link: Save closes the editor for good and the address drops editId', async () => {
  const [id] = await createLesson('ZZ SL 1.6', [0])
  await page.goto(`/lessons?editId=${id}`)
  const card = page.locator(`[data-lesson-id="${id}"]`)
  await expect(card.getByRole('button', { name: 'Save lesson' })).toBeVisible()
  await card.getByRole('button', { name: 'Save lesson' }).click()
  await expect(page).toHaveURL(/\/lessons$/)
  await page.waitForTimeout(1500) // give a refetch time to (wrongly) reopen it
  await expect(card.getByRole('button', { name: 'Save lesson' })).toHaveCount(0)
})

// ── 2. Shared lessons: what follows the group and what doesn't ───────────────

test('2.1 Renaming a shared lesson renames every learner\'s copy', async () => {
  const ids = await createLesson('ZZ SL 2.1', [0, 1, 2])
  const dialog = await openCalendarWindow('ZZ SL 2.1')
  await expect(dialog.getByRole('checkbox', { name: 'Apply to all learners in group' })).toBeChecked()
  await dialog.getByLabel('Title', { exact: true }).fill('ZZ SL 2.1 renamed')
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog).toHaveCount(0)
  for (const id of ids) expect((await lessonById(id)).title).toBe('ZZ SL 2.1 renamed')
})

test('2.2 Moving one learner\'s date leaves the others where they were', async () => {
  const ids = await createLesson('ZZ SL 2.2', [0, 1, 2])
  await page.goto('/dashboard')
  await selectLearner(page, s.learners[0].name)
  await timelineRow(page, 'ZZ SL 2.2').getByRole('button', { name: 'Edit lesson' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit lesson' })
  await expect(dialog.getByText(`Date and time change for ${s.learners[0].name} only.`)).toBeVisible()
  await dialog.getByLabel('Due date').fill(s.tomorrow)
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(timelineRow(page, 'ZZ SL 2.2')).toHaveCount(0) // gone from today for this learner
  expect((await lessonById(ids[0])).dueDate).toBe(s.tomorrow)
  expect((await lessonById(ids[1])).dueDate).toBe(s.today)
  expect((await lessonById(ids[2])).dueDate).toBe(s.today)
})

test('2.3 "Also move the date and time for every learner" moves everyone', async () => {
  const ids = await createLesson('ZZ SL 2.3', [0, 1, 2])
  const dialog = await openCalendarWindow('ZZ SL 2.3')
  await dialog.getByRole('checkbox', { name: 'Also move the date and time for every learner' }).check()
  await dialog.getByLabel('Start time hour').selectOption('2')
  await dialog.getByLabel('Start time period').selectOption('PM')
  await dialog.getByLabel('End time hour').selectOption('2')
  await dialog.getByLabel('End time minute').selectOption('30')
  await dialog.getByLabel('End time period').selectOption('PM')
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog).toHaveCount(0)
  for (const id of ids) expect((await lessonById(id)).scheduledStartTime).toBe('14:00')
})

test('2.4 Unticking "Apply to all learners" edits only this learner', async () => {
  const ids = await createLesson('ZZ SL 2.4', [0, 1])
  const dialog = await openCalendarWindow('ZZ SL 2.4')
  await dialog.getByRole('checkbox', { name: 'Apply to all learners in group' }).uncheck()
  await expect(dialog.getByRole('checkbox', { name: 'Also move the date and time for every learner' })).toHaveCount(0)
  await dialog.getByLabel('Title', { exact: true }).fill('ZZ SL 2.4 only one')
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog).toHaveCount(0)
  const titles = await Promise.all(ids.map(async id => (await lessonById(id)).title))
  expect(titles.sort()).toEqual(['ZZ SL 2.4', 'ZZ SL 2.4 only one'])
})

test('2.5 Marking a shared lesson done for one learner marks only that learner', async () => {
  const ids = await createLesson('ZZ SL 2.5', [0, 1])
  await page.goto('/dashboard')
  await selectLearner(page, s.learners[0].name)
  const r = await api(ctx.request, `/api/plan/lessons/${ids[0]}/complete`, 'PATCH', { status: 'completed' })
  expect(r.status).toBe(200)
  expect((await lessonById(ids[1])).status).toBe('not_started')
})

// ── 3. Moving a lesson to the right learner / course ──────────────────────────

test('3.1 Changing Learner and Course moves the lesson, and it leaves the shared group', async () => {
  const ids = await createLesson('ZZ SL 3.1', [0, 1])
  const dialog = await openCalendarWindow('ZZ SL 3.1')
  await dialog.getByLabel('Learner', { exact: true }).selectOption(s.learners[2].id)
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog.getByText(`Choose a course for ${s.learners[2].name}`)).toBeVisible()
  await dialog.getByLabel('Course', { exact: true }).selectOption(s.learners[2].courseId)
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog).toHaveCount(0)
  const moved = await Promise.all(ids.map(lessonById))
  const toYusuf = moved.find(l => l.childId === s.learners[2].id)
  expect(toYusuf, 'one copy now belongs to learner 3').toBeTruthy()
  expect(toYusuf.subjectId).toBe(s.learners[2].courseId)
  expect(toYusuf.groupId ?? null).toBeNull()
})

test('3.2 The server refuses a course the learner is not enrolled in, with a reason', async () => {
  const [id] = await createLesson('ZZ SL 3.2', [0])
  const r = await api(ctx.request, `/api/plan/lessons/${id}`, 'PUT', { childId: s.learners[0].id, subjectId: s.learners[1].courseId })
  expect(r.status).toBe(400)
  expect(r.body?.message).toMatch(/course/i)
  expect((await lessonById(id)).subjectId).toBe(s.learners[0].courseId)
})

// ── 4. Clearing details actually clears them ─────────────────────────────────

test('4.1 Clearing description / curriculum / chapter and unticking homework is saved', async () => {
  const [id] = await createLesson('ZZ SL 4.1', [0], { description: 'Pages 10-12', curriculum: 'Saxon', chapter: 'Ch 3', hasHomework: true })
  const dialog = await openCalendarWindow('ZZ SL 4.1')
  await dialog.getByLabel(/^Description/).fill('')
  await dialog.getByLabel(/^Curriculum/).fill('')
  await dialog.getByLabel(/^Chapter/).fill('')
  await dialog.getByRole('checkbox', { name: 'Has homework' }).uncheck()
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog).toHaveCount(0)
  const l = await lessonById(id)
  expect(l.description ?? '').toBe('')
  expect(l.curriculum ?? null).toBeNull()
  expect(l.chapter ?? null).toBeNull()
  expect(l.hasHomework ?? false).toBe(false)
})

// ── 5. Lessons page: one card per shared lesson ──────────────────────────────

test('5.1 With all three learners selected, a shared lesson is ONE card with three chips', async () => {
  await createLesson('ZZ SL 5.1', [0, 1, 2])
  await page.goto('/lessons')
  const filter = page.getByRole('group', { name: 'Filter by learner' })
  for (const l of s.learners) await filter.getByRole('button', { name: l.name }).click()
  const card = page.locator('[data-shared-group]').filter({ hasText: 'ZZ SL 5.1' })
  await expect(card).toHaveCount(1)
  await expect(card.getByRole('list', { name: 'Learners' }).getByRole('listitem')).toHaveCount(3)
  for (const l of s.learners) await expect(card.getByLabel(`${l.name}: Not started`)).toBeVisible()
})

test('5.2 With one learner selected it is that learner\'s ordinary card', async () => {
  await createLesson('ZZ SL 5.2', [0, 1, 2])
  await page.goto('/lessons')
  await page.getByRole('group', { name: 'Filter by learner' }).getByRole('button', { name: s.learners[1].name }).click()
  await expect(page.locator('[data-shared-group]').filter({ hasText: 'ZZ SL 5.2' })).toHaveCount(0)
  await expect(page.locator('[data-lesson-id]').filter({ hasText: 'ZZ SL 5.2' })).toHaveCount(1)
})

test('5.3 Marking one learner done from the shared card changes only their chip', async () => {
  const ids = await createLesson('ZZ SL 5.3', [0, 1])
  await page.goto('/lessons')
  const filter = page.getByRole('group', { name: 'Filter by learner' })
  await filter.getByRole('button', { name: s.learners[0].name }).click()
  await filter.getByRole('button', { name: s.learners[1].name }).click()
  const card = page.locator('[data-shared-group]').filter({ hasText: 'ZZ SL 5.3' })
  await card.getByRole('button', { name: 'Show learners' }).click()
  await card.locator(`[data-lesson-id="${ids[0]}"]`).getByRole('button', { name: 'Mark lesson done' }).click()
  await expect(card.getByLabel(`${s.learners[0].name}: Completed`)).toBeVisible()
  await expect(card.getByLabel(`${s.learners[1].name}: Not started`)).toBeVisible()
  expect((await lessonById(ids[1])).status).toBe('not_started')
})

// ── 6. Delete: one learner or all ────────────────────────────────────────────

test('6.1 Delete → "Just <learner>" removes only that copy', async () => {
  const ids = await createLesson('ZZ SL 6.1', [0, 1, 2])
  const dialog = await openCalendarWindow('ZZ SL 6.1')
  await dialog.getByRole('button', { name: 'Delete this lesson' }).click()
  await dialog.getByRole('button', { name: `Just ${s.learners[0].name}` }).click()
  await expect(dialog).toHaveCount(0)
  await expect(timelineRow(page, 'ZZ SL 6.1')).toHaveCount(2) // the Calendar shows all learners
  expect((await api(ctx.request, `/api/plan/lessons/${ids[0]}`)).status).toBe(404)
  expect((await api(ctx.request, `/api/plan/lessons/${ids[1]}`)).status).toBe(200)
})

test('6.2 Delete → "All learners in this group" removes every copy', async () => {
  const ids = await createLesson('ZZ SL 6.2', [0, 1, 2])
  const dialog = await openCalendarWindow('ZZ SL 6.2')
  await dialog.getByRole('button', { name: 'Delete this lesson' }).click()
  await dialog.getByRole('button', { name: 'All learners in this group' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(timelineRow(page, 'ZZ SL 6.2')).toHaveCount(0)
  for (const id of ids) expect((await api(ctx.request, `/api/plan/lessons/${id}`)).status).toBe(404)
})

test('6.3 Cancel on the delete question deletes nothing', async () => {
  const ids = await createLesson('ZZ SL 6.3', [0, 1])
  const dialog = await openCalendarWindow('ZZ SL 6.3')
  await dialog.getByRole('button', { name: 'Delete this lesson' }).click()
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog.getByLabel('Title', { exact: true })).toBeVisible()
  for (const id of ids) expect((await api(ctx.request, `/api/plan/lessons/${id}`)).status).toBe(200)
})

test('6.4 Deleting the whole shared lesson from the Lessons page says how many were deleted', async () => {
  await createLesson('ZZ SL 6.4', [0, 1, 2])
  await page.goto('/lessons')
  const filter = page.getByRole('group', { name: 'Filter by learner' })
  for (const l of s.learners) await filter.getByRole('button', { name: l.name }).click()
  const card = page.locator('[data-shared-group]').filter({ hasText: 'ZZ SL 6.4' })
  await card.getByRole('button', { name: 'Delete shared lesson' }).click()
  await page.getByRole('button', { name: 'Delete for all 3' }).click()
  await expect(page.getByText('“ZZ SL 6.4” deleted for 3 learners')).toBeVisible()
  await expect(page.locator('[data-shared-group]').filter({ hasText: 'ZZ SL 6.4' })).toHaveCount(0)
})

test('6.5 A learner login cannot delete a lesson (refused by the server)', async ({ browser, baseURL }) => {
  const [id] = await createLesson('ZZ SL 6.5', [0, 1])
  const learnerCtx = await browser.newContext({ baseURL })
  try {
    await signIn(learnerCtx, baseURL!, s.learners[0].email)
    const r = await api(learnerCtx.request, `/api/plan/lessons/${id}?deleteGroup=true`, 'DELETE')
    expect(r.status).toBeGreaterThanOrEqual(400)
    expect((await api(ctx.request, `/api/plan/lessons/${id}`)).status).toBe(200)
  } finally {
    await learnerCtx.close()
  }
})

// ── 7. Why this time ─────────────────────────────────────────────────────────

test('7.1 The editor says when a lesson uses its course time, and why it doesn\'t on another day', async () => {
  await createLesson('ZZ SL 7.1', [0])
  const dialog = await openCalendarWindow('ZZ SL 7.1')
  await expect(dialog.getByTestId('lesson-time-hint')).toHaveText(`Uses ZZ UAT SL Math 1's time on ${s.todayName}s: 10:15 AM.`)
  await dialog.getByLabel('Due date').fill(s.tomorrow)
  await expect(dialog.getByTestId('lesson-time-hint')).toContainText(`has no set time on ${s.tomorrowName}s`)
  await dialog.getByLabel('Start time hour').selectOption('1')
  await dialog.getByLabel('End time hour').selectOption('2')
  await expect(dialog.getByTestId('lesson-time-hint')).toHaveCount(0)
})

// ── 8. Phone width ───────────────────────────────────────────────────────────

test('8.1 At phone width, the Planner list opens the window in place and Save works', async () => {
  const [id] = await createLesson('ZZ SL 8.1', [0])
  await page.setViewportSize({ width: 375, height: 812 })
  try {
    await page.goto('/plan')
    await selectLearner(page, s.learners[0].name)
    const todayHeader = page.getByRole('button', { name: new RegExp(s.todayName) }).first()
    if (await page.getByRole('button', { name: /ZZ SL 8\.1/ }).count() === 0) await todayHeader.click()
    await page.getByRole('button', { name: /ZZ SL 8\.1/ }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Edit lesson' })
    await dialog.getByLabel('Title', { exact: true }).fill('ZZ SL 8.1 phone')
    await dialog.getByRole('button', { name: 'Save changes' }).click()
    await expect(dialog).toHaveCount(0)
    expect((await lessonById(id)).title).toBe('ZZ SL 8.1 phone')
  } finally {
    await page.setViewportSize({ width: 1280, height: 720 })
  }
})
