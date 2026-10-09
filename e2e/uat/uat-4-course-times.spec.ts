import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import { ALL_DAYS, api, createProbeLearner, selectLearner, signIn, timelineRow, ProbeLedger } from './helpers'

/**
 * UAT Test 4 — Course times on the schedule, step by step as on the checklist.
 *
 * Amir's run (Oct 8): 4.1–4.4 pass; 4.5 BLOCKED ("there is no place for editing the
 * time"), 4.6 blocked. Behind it:
 *  - 4.5: every edit path except the Dashboard modal (Full Calendar, Planner) opens
 *    the LessonCard inline editor at /lessons?editId=, which has no time fields.
 *  - 4.6 (and 4.1 as written): the course edit dialog has no weekly-time fields; a
 *    course's time can only be set when the course is created.
 *  - Found while tracing: a lesson's own time can never be cleared (blank pickers
 *    send `undefined`, which never reaches the server).
 *
 * All data is a throwaway "ZZ UAT Probe" learner with its own courses and lessons,
 * deleted/archived afterwards. Steps run in checklist order, but each creates
 * whatever lesson state it depends on: after a failure Playwright restarts the
 * worker (re-running beforeAll with fresh probe data), so a step must never rely
 * on an earlier step having run in the same worker.
 */

let ctx: BrowserContext
let page: Page
const ledger = new ProbeLedger()
const state = {
  learnerId: '', learnerName: '',
  timedCourseId: '',     // created WITH 10:15–11:00 (how 4.1 passed for Amir)
  untimedCourseId: '',   // created without a time — 4.1 as written edits one of these
  today: '',
  lessonId: '',          // 4.2 — today, timed course, no time of its own (setup, beforeAll)
}

const LESSON_TITLE = 'ZZ UAT 4.2 untimed lesson'

async function createLesson(title: string, ownTime?: { start: string; end: string }) {
  const res = await api(ctx.request, '/api/plan/lessons', 'POST', {
    childId: state.learnerId, subjectId: state.timedCourseId, title, dueDate: state.today, estimatedDuration: '30min',
    ...(ownTime ? { scheduledStartTime: ownTime.start, scheduledEndTime: ownTime.end } : {}),
  })
  expect(res.status, `create lesson: ${res.body?.message}`).toBe(201)
  ledger.lessonIds.push(res.body!.data.id)
  return res.body!.data.id as string
}

async function openDashboardFor(learnerName: string) {
  await page.goto('/dashboard')
  await selectLearner(page, learnerName)
  const panel = page.getByTestId('today-schedule-panel')
  await expect(panel).toBeVisible()
  return panel
}

async function openCoursesTab() {
  await page.goto('/settings')
  await page.getByRole('tab', { name: 'Courses' }).click()
}

test.beforeAll(async ({ browser, baseURL }) => {
  ctx = await browser.newContext({ baseURL })
  await signIn(ctx, baseURL!)

  const probe = await createProbeLearner(ctx.request)
  state.learnerId = probe.id
  state.learnerName = probe.name
  ledger.learnerIds.push(probe.id)

  const timed = await api(ctx.request, '/api/subjects', 'POST', {
    name: 'ZZ UAT Timed Course', category: 'Math', learnerIds: [probe.id],
    recurringSchedule: [{ daysOfWeek: ALL_DAYS, startTime: '10:15', endTime: '11:00' }],
  })
  expect(timed.status, `create timed course: ${timed.body?.message}`).toBeLessThan(300)
  state.timedCourseId = timed.body!.data.id
  ledger.courseIds.push(state.timedCourseId)

  const untimed = await api(ctx.request, '/api/subjects', 'POST', {
    name: 'ZZ UAT Untimed Course', category: 'Science', learnerIds: [probe.id],
  })
  expect(untimed.status, `create untimed course: ${untimed.body?.message}`).toBeLessThan(300)
  state.untimedCourseId = untimed.body!.data.id
  ledger.courseIds.push(state.untimedCourseId)

  // "Today" is the server's today (Render runs in UTC) — the date the schedule is built for.
  const sched = await api(ctx.request, `/api/schedule/today?childId=${encodeURIComponent(probe.id)}`)
  expect(sched.status).toBe(200)
  state.today = sched.body!.data.date

  // 4.2 is setup on the checklist ("add one if needed").
  state.lessonId = await createLesson(LESSON_TITLE)

  page = await ctx.newPage()
})

test.afterAll(async () => {
  if (ctx) await ledger.cleanup(ctx.request)
  await ctx?.close()
})

test('4.1 — Settings → Courses: edit a course and add a recurring time (10:15–11:00 on today\'s weekday)', async () => {
  await openCoursesTab()
  const row = page.getByRole('row').filter({ hasText: 'ZZ UAT Untimed Course' })
  await row.getByRole('button', { name: 'Edit' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: /add recurring weekly schedule/i }).click()
  const weekday = ALL_DAYS[new Date(`${state.today}T12:00:00Z`).getUTCDay()]
  await dialog.getByTestId(`recurring-day-${weekday}-0`).check()
  await dialog.getByLabel('Start time').fill('10:15')
  await dialog.getByLabel('End time').fill('11:00')
  await dialog.getByRole('button', { name: /save/i }).click()
  await expect(dialog).toHaveCount(0)

  const saved = await api(ctx.request, `/api/subjects/${state.untimedCourseId}`)
  expect(saved.body?.data?.recurringSchedule).toEqual([{ daysOfWeek: [weekday], startTime: '10:15', endTime: '11:00' }])
})

test('4.2 — the learner has a lesson today for that course with no start or end time', async () => {
  const lesson = await api(ctx.request, `/api/plan/lessons/${state.lessonId}`)
  expect(lesson.body?.data?.scheduledStartTime ?? null).toBeNull()
})

test('4.3 — Dashboard → Today\'s Schedule shows the lesson at 10:15', async () => {
  await openDashboardFor(state.learnerName)
  await expect(timelineRow(page, LESSON_TITLE)).toContainText('10:15 AM')
})

test('4.4 — View Full Calendar shows the same time', async () => {
  const panel = await openDashboardFor(state.learnerName)
  await panel.getByRole('link', { name: 'View Full Calendar' }).click()
  await page.waitForURL(/\/plan\/schedule/)
  await expect(timelineRow(page, LESSON_TITLE)).toContainText('10:15 AM')
})

test('4.5 — from the Full Calendar, edit that lesson and give it its own time, 1:00 – 1:30 PM', async () => {
  await page.goto(`/plan/schedule?date=${state.today}`)
  const row = timelineRow(page, LESSON_TITLE)
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Edit lesson' }).click()
  await page.waitForURL(/\/lessons\?editId=/)

  const editor = page.locator(`[data-lesson-id="${state.lessonId}"]`)
  await expect(editor).toBeVisible()
  await editor.getByLabel('Start time hour').selectOption('1')
  await editor.getByLabel('Start time minute').selectOption('00')
  await editor.getByLabel('Start time period').selectOption('PM')
  await editor.getByLabel('End time hour').selectOption('1')
  await editor.getByLabel('End time minute').selectOption('30')
  await editor.getByLabel('End time period').selectOption('PM')
  await editor.getByRole('button', { name: /save/i }).click()

  await expect.poll(async () => (await api(ctx.request, `/api/plan/lessons/${state.lessonId}`)).body?.data?.scheduledStartTime)
    .toBe('13:00')
  await page.goto(`/plan/schedule?date=${state.today}`)
  await expect(timelineRow(page, LESSON_TITLE)).toContainText('1:00 PM')
})

test('4.5 — the Dashboard modal also sets a lesson\'s own time (path that already works)', async () => {
  const id = await createLesson('ZZ UAT 4.5 modal lesson')
  const panel = await openDashboardFor(state.learnerName)
  await timelineRow(page, 'ZZ UAT 4.5 modal lesson').getByRole('button', { name: 'Edit lesson' }).click()
  const modal = page.getByTestId('edit-lesson-modal')
  await modal.getByLabel('Start time hour').selectOption('2')
  await modal.getByLabel('Start time period').selectOption('PM')
  await modal.getByLabel('End time hour').selectOption('2')
  await modal.getByLabel('End time minute').selectOption('30')
  await modal.getByLabel('End time period').selectOption('PM')
  await modal.getByRole('button', { name: /save|update/i }).click()
  await expect(modal).toHaveCount(0)
  await expect.poll(async () => (await api(ctx.request, `/api/plan/lessons/${id}`)).body?.data?.scheduledStartTime)
    .toBe('14:00')
  await expect(panel).toBeVisible()
})

test('4.6 — Settings → Courses: change the course time to 9:00 – 9:45; untimed lessons move to 9:00', async () => {
  const UNTIMED = 'ZZ UAT 4.6 untimed lesson'
  const OWN_TIME = 'ZZ UAT 4.6 lesson with own time'
  await createLesson(UNTIMED)
  await createLesson(OWN_TIME, { start: '13:00', end: '13:30' })

  await openCoursesTab()
  const row = page.getByRole('row').filter({ hasText: 'ZZ UAT Timed Course' })
  await row.getByRole('button', { name: 'Edit' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByLabel('Start time')).toHaveValue('10:15')
  await dialog.getByLabel('Start time').fill('09:00')
  await dialog.getByLabel('End time').fill('09:45')
  await dialog.getByRole('button', { name: /save/i }).click()
  await expect(dialog).toHaveCount(0)

  await openDashboardFor(state.learnerName)
  await expect(timelineRow(page, UNTIMED)).toContainText('9:00 AM')
  // A lesson's own time still wins over the new course time.
  await expect(timelineRow(page, OWN_TIME)).toContainText('1:00 PM')
})

test('4.5 follow-up — removing a lesson\'s own time (from the Calendar edit path) puts it back at the course time', async () => {
  const TITLE = 'ZZ UAT 4.5 clear own time'
  const id = await createLesson(TITLE, { start: '13:00', end: '13:30' })
  await page.goto(`/lessons?editId=${id}`)
  const editor = page.locator(`[data-lesson-id="${id}"]`)
  await expect(editor).toBeVisible()
  await expect(editor.getByLabel('Start time hour')).toHaveValue('1')
  await editor.getByLabel('Start time hour').selectOption('')
  await editor.getByLabel('End time hour').selectOption('')
  await editor.getByRole('button', { name: /save/i }).click()

  await expect.poll(async () => (await api(ctx.request, `/api/plan/lessons/${id}`)).body?.data?.scheduledStartTime ?? null)
    .toBeNull()
})

test('4.5 follow-up — removing a lesson\'s own time from the Dashboard modal puts it back at the course time', async () => {
  const TITLE = 'ZZ UAT 4.5 clear own time (modal)'
  const id = await createLesson(TITLE, { start: '13:00', end: '13:30' })
  await openDashboardFor(state.learnerName)
  await timelineRow(page, TITLE).getByRole('button', { name: 'Edit lesson' }).click()
  const modal = page.getByTestId('edit-lesson-modal')
  await expect(modal.getByLabel('Start time hour')).toHaveValue('1')
  await modal.getByLabel('Start time hour').selectOption('')
  await modal.getByLabel('End time hour').selectOption('')
  await modal.getByRole('button', { name: /save|update/i }).click()
  await expect(modal).toHaveCount(0)

  await expect.poll(async () => (await api(ctx.request, `/api/plan/lessons/${id}`)).body?.data?.scheduledStartTime ?? null)
    .toBeNull()
})
