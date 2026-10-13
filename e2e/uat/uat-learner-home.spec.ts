import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import { ALL_DAYS, api, createProbeLearner, signIn, timelineRow, ProbeLedger } from './helpers'

/**
 * UAT 8.3 (Amir, 2026-10-12): marked pass with the note "dashboard failed". A learner
 * login's Home said "Error Loading Dashboard"; their other pages loaded a sibling and were
 * refused; the sidebar offered parent pages; and Quran / learning-time reads without a
 * learner filter returned every child's data.
 *
 * Runs as a real learner login on dev: a throwaway "ZZ UAT Probe" learner with its own
 * course and lesson, archived/deleted afterwards.
 */

let owner: BrowserContext
let learner: BrowserContext
let page: Page
const ledger = new ProbeLedger()
const quranIds: string[] = []
const s = { id: '', name: '', email: '', courseId: '', lessonId: '', siblingId: '', today: '' }
const LESSON = 'ZZ UAT LH lesson'

test.beforeAll(async ({ browser, baseURL }) => {
  owner = await browser.newContext({ baseURL })
  await signIn(owner, baseURL!)

  const probe = await createProbeLearner(owner.request, { withLogin: true })
  Object.assign(s, { id: probe.id, name: probe.name, email: probe.email })
  ledger.learnerIds.push(probe.id)

  const kids = (await api(owner.request, '/api/children/children')).body!.data as { id: string }[]
  s.siblingId = kids.find(k => k.id !== probe.id)!.id

  const course = await api(owner.request, '/api/subjects', 'POST', {
    name: 'ZZ UAT LH Course', category: 'Math', learnerIds: [probe.id],
    recurringSchedule: [{ daysOfWeek: ALL_DAYS, startTime: '10:15', endTime: '11:00' }],
  })
  expect(course.status, `create course: ${course.body?.message}`).toBeLessThan(300)
  s.courseId = course.body!.data.id
  ledger.courseIds.push(s.courseId)

  // The browser's today (the page builds My day for the local date).
  const d = new Date()
  s.today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const lesson = await api(owner.request, '/api/plan/lessons', 'POST', {
    childId: probe.id, subjectId: s.courseId, title: LESSON, dueDate: s.today, estimatedDuration: '30min',
  })
  expect(lesson.status, `create lesson: ${lesson.body?.message}`).toBe(201)
  s.lessonId = lesson.body!.data.id
  ledger.lessonIds.push(s.lessonId)

  learner = await browser.newContext({ baseURL })
  await signIn(learner, baseURL!, s.email)
  page = await learner.newPage()
})

test.afterAll(async () => {
  for (const id of quranIds) await api(owner.request, `/api/quran/sessions/${id}`, 'DELETE')
  if (owner) await ledger.cleanup(owner.request)
  await learner?.close()
  await owner?.close()
})

/** Collects API calls the server refused while `run` executes. */
async function refusedCalls(run: () => Promise<void>) {
  const refused: string[] = []
  const onResponse = (r: { url(): string; status(): number }) => {
    if (r.url().includes('/api/') && r.status() >= 400) refused.push(`${r.status()} ${new URL(r.url()).pathname}`)
  }
  page.on('response', onResponse)
  try { await run() } finally { page.off('response', onResponse) }
  return refused
}

test('LH.1 A learner’s Home is "My day" and loads with nothing refused', async () => {
  const refused = await refusedCalls(async () => {
    await page.goto('/dashboard')
    await expect(page.getByTestId('learner-home')).toBeVisible()
    await expect(timelineRow(page, LESSON)).toBeVisible()
    await page.waitForLoadState('networkidle')
  })
  await expect(page.getByText('Error Loading Dashboard')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: /^Marhaba/ })).toBeVisible()
  expect(refused).toEqual([])
})

test('LH.2 The lesson shows at its course time, with no edit pencil, and Mark done marks it', async () => {
  await page.goto('/dashboard')
  const row = timelineRow(page, LESSON)
  await expect(row).toContainText('10:15 AM')
  await expect(row.getByRole('button', { name: 'Edit lesson' })).toHaveCount(0)
  await row.getByRole('button', { name: `Mark ${LESSON} done` }).click()
  await expect(row.getByRole('button', { name: `Mark ${LESSON} done` })).toHaveCount(0)
  await expect.poll(async () => (await api(owner.request, `/api/plan/lessons/${s.lessonId}`)).body?.data?.status).toBe('completed')
})

test('LH.3 The sidebar shows only learner pages, and there is no learner picker or bell', async () => {
  await page.goto('/dashboard')
  for (const id of ['home', 'planbook', 'growth']) await expect(page.getByTestId(`nav-module-${id}`)).toBeVisible()
  for (const id of ['records', 'people', 'messages']) await expect(page.getByTestId(`nav-module-${id}`)).toHaveCount(0)
  for (const id of ['attendance', 'gradebook', 'resources', 'compliance', 'my-feedback']) await expect(page.getByTestId(`nav-item-${id}`)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Viewing learner' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /notifications/i })).toHaveCount(0)
})

test('LH.4 A sibling left selected in the tab is replaced, so Learning Time loads the learner’s own data', async () => {
  await page.goto('/about')
  await page.evaluate(id => sessionStorage.setItem('sheath.selectedChildId', id), s.siblingId)
  const refused = await refusedCalls(async () => {
    await page.goto('/learning-time')
    await page.waitForLoadState('networkidle')
  })
  expect(refused.filter(r => !r.includes('/school-years/'))).toEqual([])
  await expect(page.getByText('Learners can only access their own information.')).toHaveCount(0)
  expect(await page.evaluate(() => sessionStorage.getItem('sheath.selectedChildId'))).toBe(s.id)
})

test('LH.5 A learner reads only their own profile, Quran and learning time', async () => {
  const logged = await api(learner.request, '/api/quran/sessions', 'POST', {
    childId: s.id, type: 'New memorization', surah: 'Al-Fatiha', fromAyah: 1, toAyah: 7, notes: '', date: s.today,
  })
  expect(logged.status, `log quran: ${logged.body?.message}`).toBeLessThan(300)
  quranIds.push(logged.body!.data.id)

  const kids = (await api(learner.request, '/api/children/children')).body!.data as { id: string }[]
  expect(kids.map(k => k.id)).toEqual([s.id])

  const quran = (await api(learner.request, '/api/quran/sessions')).body!.data.sessions as { childId: string }[]
  expect(quran.length).toBeGreaterThan(0)
  expect(new Set(quran.map(q => q.childId))).toEqual(new Set([s.id]))

  const time = (await api(learner.request, '/api/learning-time/sessions')).body!.data as { learnerId: string }[]
  expect(time.every(t => t.learnerId === s.id)).toBe(true)

  // Owner still sees the household.
  const ownerKids = (await api(owner.request, '/api/children/children')).body!.data as { id: string }[]
  expect(ownerKids.length).toBeGreaterThan(1)
})

test('LH.6 The parent Dashboard is unchanged', async () => {
  const parent = await owner.newPage()
  try {
    await parent.goto('/dashboard')
    await expect(parent.getByTestId('dashboard-zone-today')).toBeVisible()
    await expect(parent.getByText('Error Loading Dashboard')).toHaveCount(0)
    await expect(parent.getByRole('button', { name: /notifications/i })).toBeVisible()
    await expect(parent.getByTestId('nav-module-records')).toBeVisible()
  } finally {
    await parent.close()
  }
})
