import { expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test'

/**
 * Shared plumbing for the browser UAT specs. Mirrors scripts/uat-dev.js:
 * dev-bypass sign-in, throwaway "ZZ UAT" probe data, refuse production.
 */

const PROD_HOSTS = ['sheathacademy.com', 'www.sheathacademy.com']

export function requireUatEnv(baseURL: string | undefined): string {
  const secret = process.env.DEV_BYPASS_SECRET
  if (!secret) throw new Error('DEV_BYPASS_SECRET is not set — export it and re-run (it is never committed).')
  const host = new URL(baseURL ?? '').host
  if (PROD_HOSTS.includes(host)) throw new Error(`Refusing to run UAT against production (${host}). These specs write data.`)
  return secret
}

/**
 * NextAuth dev-bypass sign-in through the context's own request client, so the
 * session cookie lands in the browser context. `email` omitted = the dev seed owner.
 */
export async function signIn(context: BrowserContext, baseURL: string, email?: string) {
  const secret = requireUatEnv(baseURL)
  const csrf = await context.request.get('/api/auth/csrf')
  const { csrfToken } = await csrf.json()
  const res = await context.request.post('/api/auth/callback/bypass', {
    form: { csrfToken, secret, callbackUrl: `${baseURL}/`, json: 'true', ...(email ? { email } : {}) },
    maxRedirects: 0,
  })
  expect(res.status(), 'bypass sign-in').toBeLessThan(400)
  const session = await (await context.request.get('/api/auth/session')).json()
  expect(session?.user?.email, 'signed-in session').toBeTruthy()
  return session.user as { email: string; householdId: string }
}

type Json = { status: number; body: { status?: string; data?: any; message?: string } | null }

export async function api(request: APIRequestContext, path: string, method = 'GET', data?: unknown): Promise<Json> {
  const res = await request.fetch(path, { method, data, failOnStatusCode: false })
  let body = null
  try { body = await res.json() } catch { /* non-JSON */ }
  return { status: res.status(), body }
}

export const ALL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Creates the throwaway learner every UAT spec works on. Archive it with `archiveProbe`. */
export async function createProbeLearner(owner: APIRequestContext, opts: { withLogin?: boolean } = {}) {
  const stamp = Date.now().toString(36)
  const res = await api(owner, '/api/children/children', 'POST', {
    name: `ZZ UAT Probe ${stamp}`,
    firstName: 'ZZ',
    lastName: `UAT Probe ${stamp}`,
    gradeLabel: 'Grade 5',
    ...(opts.withLogin
      ? { learnerLoginEnabled: true, username: `zz.uat.${stamp}`, password: `Uat!${Math.random().toString(36).slice(2, 10)}` }
      : {}),
  })
  expect(res.status, `create probe learner: ${res.body?.message}`).toBe(201)
  const id: string = res.body!.data.id
  return { id, name: res.body!.data.name as string, email: `learner.${id}@no-email.local` }
}

/** Probe data this spec created — the only things cleanup touches. */
export class ProbeLedger {
  lessonIds: string[] = []
  courseIds: string[] = []
  learnerIds: string[] = []

  async cleanup(owner: APIRequestContext) {
    const problems: string[] = []
    for (const id of this.lessonIds) {
      const r = await api(owner, `/api/plan/lessons/${id}`, 'DELETE')
      if (r.status !== 200) problems.push(`lesson ${id}: ${r.status}`)
    }
    for (const id of this.courseIds) {
      const r = await api(owner, `/api/subjects/${id}/archive`, 'PATCH')
      if (r.status !== 200) problems.push(`course ${id}: ${r.status}`)
    }
    for (const id of this.learnerIds) {
      const r = await api(owner, `/api/children/children/${id}/archive`, 'PATCH')
      if (r.status !== 200) problems.push(`learner ${id}: ${r.status}`)
    }
    if (problems.length) console.warn(`UAT cleanup incomplete — ${problems.join('; ')}`)
  }
}

/** Header learner switcher → pick a learner by name (what a tester does first). */
export async function selectLearner(page: Page, name: string) {
  await page.getByRole('button', { name: 'Viewing learner' }).click()
  await page.getByRole('option', { name: new RegExp(name) }).click()
  await expect(page.getByRole('button', { name: 'Viewing learner' })).toContainText(name)
}

/** A row on a schedule timeline (Dashboard Today's Schedule or Full Calendar), by lesson title. */
export function timelineRow(page: Page, title: string) {
  return page.locator('[data-testid^="timeline-entry-"]').filter({ hasText: title })
}
