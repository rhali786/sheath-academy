#!/usr/bin/env node
/**
 * Automated UAT against the deployed dev site (dev.sheathacademy.com).
 *
 * Exercises the Wave 1-2 feedback batch (PR #43, phases 0-7) and the October
 * blockers batch (PR #46, phases B1-B4: quick start, lesson shift, breaks, course
 * times) against a REAL database and a REAL session — the half that Jest cannot
 * cover, because the repository layer is mocked in unit tests and the DB-backed
 * tests skip without a reachable DATABASE_URL.
 *
 * Usage:
 *   DEV_BYPASS_SECRET=<secret> node scripts/uat-dev.js
 *   DEV_BYPASS_SECRET=<secret> node scripts/uat-dev.js --base http://localhost:3000
 *
 * The secret is NEVER stored here (CLAUDE.md: never commit secrets). It is read
 * from the environment only.
 *
 * Safety:
 *   - Refuses to run against the production host outright.
 *   - Creates its own throwaway learner ("ZZ UAT Probe") for the learner-role
 *     checks rather than touching a real learner's credentials, and archives it
 *     afterwards.
 *   - B1-B4 work only on that probe learner: its own course ("ZZ UAT Course",
 *     archived afterwards), its own lessons (the ONLY thing ever deleted — and only
 *     the ids this run created), and its own sessions (finalized). Every shift is
 *     filtered to the probe learner, so no real lesson moves.
 *   - B3 temporarily adds a "ZZ UAT Break" to the active school year and always
 *     restores the original breaks list, even if a check fails.
 */

const DEFAULT_BASE = 'https://dev.sheathacademy.com'
const PROD_HOSTS = ['sheathacademy.com', 'www.sheathacademy.com']

const args = process.argv.slice(2)
function argOf(name, fallback) {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const BASE = (argOf('--base', DEFAULT_BASE) || '').replace(/\/$/, '')
const SECRET = process.env.DEV_BYPASS_SECRET
const VERBOSE = args.includes('--verbose')

const UAT_LEARNER_NAME = 'ZZ UAT Probe'
const UAT_USERNAME = `zz.uat.${Date.now().toString(36)}`
const UAT_PASSWORD = `Uat!${Math.random().toString(36).slice(2, 10)}`

// ── preflight ────────────────────────────────────────────────────────────────

if (!SECRET) {
  console.error('DEV_BYPASS_SECRET is not set. Export it (or pass it inline) and re-run.')
  console.error('  DEV_BYPASS_SECRET=<secret> node scripts/uat-dev.js')
  process.exit(2)
}

const baseHost = (() => {
  try { return new URL(BASE).host } catch { return null }
})()
if (!baseHost) {
  console.error(`--base is not a valid URL: ${BASE}`)
  process.exit(2)
}
if (PROD_HOSTS.includes(baseHost)) {
  console.error(`Refusing to run UAT against production (${baseHost}). This script writes data.`)
  process.exit(2)
}

// ── tiny cookie-jar http client ──────────────────────────────────────────────

function makeSession(label) {
  const jar = new Map()

  function cookieHeader() {
    return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
  }

  function absorb(res) {
    const raw = typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : [res.headers.get('set-cookie')].filter(Boolean)
    for (const line of raw) {
      const [pair] = line.split(';')
      const idx = pair.indexOf('=')
      if (idx > 0) jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim())
    }
  }

  async function request(path, { method = 'GET', body, form, redirect = 'manual' } = {}) {
    const headers = { cookie: cookieHeader() }
    let payload
    if (form) {
      headers['content-type'] = 'application/x-www-form-urlencoded'
      payload = new URLSearchParams(form).toString()
    } else if (body !== undefined) {
      headers['content-type'] = 'application/json'
      payload = JSON.stringify(body)
    }
    const res = await fetch(`${BASE}${path}`, { method, headers, body: payload, redirect })
    absorb(res)
    if (VERBOSE) console.log(`    [${label}] ${method} ${path} -> ${res.status}`)
    return res
  }

  async function json(path, opts) {
    const res = await request(path, opts)
    let parsed = null
    try { parsed = await res.json() } catch { /* non-JSON */ }
    return { status: res.status, body: parsed }
  }

  async function text(path, opts) {
    const res = await request(path, opts)
    return { status: res.status, body: await res.text() }
  }

  /** NextAuth dev-bypass login. `email` omitted = the dev seed (owner) user. */
  async function login(email) {
    const csrf = await json('/api/auth/csrf')
    const token = csrf.body?.csrfToken
    if (!token) throw new Error(`could not obtain csrfToken (status ${csrf.status})`)
    const res = await request('/api/auth/callback/bypass', {
      method: 'POST',
      form: {
        csrfToken: token,
        secret: SECRET,
        callbackUrl: `${BASE}/dashboard`,
        json: 'true',
        ...(email ? { email } : {}),
      },
    })
    if (res.status >= 400) throw new Error(`bypass login failed (status ${res.status})`)
    const session = await json('/api/auth/session')
    if (!session.body?.user?.email) {
      throw new Error('bypass login produced no session — is DEV_BYPASS_SECRET correct for this environment?')
    }
    return session.body.user
  }

  return { request, json, text, login, jar }
}

// ── test harness ─────────────────────────────────────────────────────────────

const results = []
async function check(name, fn) {
  try {
    const detail = await fn()
    results.push({ name, ok: true, detail: detail || '' })
    console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ''}`)
  } catch (err) {
    results.push({ name, ok: false, detail: err.message })
    console.log(`  FAIL  ${name} — ${err.message}`)
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nUAT against ${BASE}\n`)

  const owner = makeSession('owner')
  const ownerUser = await owner.login()
  console.log(`Signed in as ${ownerUser.email} (household ${ownerUser.householdId})\n`)

  // NOTE ON SCOPE — what this harness can and cannot prove.
  //
  // Every page in this app is client-rendered: the SSR HTML for /dashboard and
  // /lessons is an ~8KB skeleton containing none of the UI text (verified — not
  // even pre-existing strings like "Lesson Planner" appear). So scraping HTML or
  // JS chunks cannot confirm client-only UI, and any check that tried would be a
  // false negative generator.
  //
  // Therefore this harness covers the server: API behaviour, authorization, and
  // data correctness — which is where all the risk in phases 3/5/6/7 lives. Two
  // items are purely client-side UI and are deliberately NOT checked here:
  //   - Phase 2, the "Learning Time" sidebar entry (navConfig unit tests + browser)
  //   - Phase 4, the "Overdue" option in the lessons status filter (unit +
  //     integration tests + browser)
  // Both are covered by Jest and were confirmed in a browser against dev.

  // ── Phase 0 ────────────────────────────────────────────────────────────────
  console.log('\nPhase 0 — /about never fails on DB availability')
  await check('/about renders 200', async () => {
    const res = await owner.text('/about')
    assert(res.status === 200, `expected 200, got ${res.status}`)
    return `${res.body.length} bytes`
  })

  // ── Phase 2 + 4 (client-bundle strings) ───────────────────────────────────
  console.log('\nPhase 2 — Learning Time route is served (nav entry itself is browser-verified)')
  await check('/learning-time renders 200 for a signed-in user', async () => {
    const res = await owner.text('/learning-time')
    assert(res.status === 200, `expected 200, got ${res.status}`)
  })

  // ── Phase 3 ────────────────────────────────────────────────────────────────
  console.log('\nPhase 3 — platform badges setting is read, not just written')
  await check('badge collection shrinks when platform badges are disabled', async () => {
    const learners = await owner.json('/api/children/children?includeArchived=false')
    const first = (learners.body?.data || [])[0]
    assert(first, 'no learners in this household to test with')

    const original = await owner.json('/api/badges/settings')
    const wasEnabled = original.body?.data?.platformBadgesEnabled !== false

    // Measure from a known state — the household may already have platform badges off.
    await owner.json('/api/badges/settings', { method: 'PUT', body: { platformBadgesEnabled: true } })
    const before = await owner.json(`/api/badges/collection?learnerId=${encodeURIComponent(first.id)}`)
    assert(before.status === 200, `collection read failed (${before.status})`)
    const baseline = (before.body?.data || []).length

    await owner.json('/api/badges/settings', { method: 'PUT', body: { platformBadgesEnabled: false } })
    const disabled = await owner.json(`/api/badges/collection?learnerId=${encodeURIComponent(first.id)}`)
    const withoutPlatform = (disabled.body?.data || []).length
    // restore
    await owner.json('/api/badges/settings', { method: 'PUT', body: { platformBadgesEnabled: wasEnabled } })

    assert(
      withoutPlatform < baseline,
      `expected fewer badges with platform disabled, got ${withoutPlatform} vs ${baseline} (setting still inert?)`,
    )
    return `${baseline} -> ${withoutPlatform} badges`
  })

  // ── Phase 5 ────────────────────────────────────────────────────────────────
  console.log('\nPhase 5 — Gradebook agrees with Settings on course membership')
  await check('every course a learner is enrolled in appears in their gradebook', async () => {
    const [subjectsRes, summariesRes] = await Promise.all([
      owner.json('/api/subjects'),
      owner.json('/api/gradebook/summaries'),
    ])
    assert(subjectsRes.status === 200, `subjects read failed (${subjectsRes.status})`)
    assert(summariesRes.status === 200, `summaries read failed (${summariesRes.status})`)

    const subjects = subjectsRes.body?.data || []
    const summaries = summariesRes.body?.data || []
    assert(summaries.length > 0, 'no gradebook summaries returned')

    const missing = []
    for (const summary of summaries) {
      const expected = subjects.filter(s => (s.learnerIds || [s.childId]).includes(summary.learnerId))
      const present = new Set((summary.subjects || []).map(s => s.subjectId))
      for (const course of expected) {
        if (!present.has(course.id)) missing.push(`${summary.learnerName}/${course.name}`)
      }
    }
    assert(missing.length === 0, `courses missing from gradebook: ${missing.slice(0, 6).join(', ')}`)
    return `${summaries.length} learners, ${subjects.length} courses, 0 mismatches`
  })

  // ── Phase 6 ────────────────────────────────────────────────────────────────
  console.log('\nPhase 6 — learner login enable/disable/re-enable')
  let probeLearnerId = null
  let probeEmail = null

  await check('creating a learner with login enabled reports learnerLoginEnabled=true', async () => {
    const res = await owner.json('/api/children/children', {
      method: 'POST',
      body: {
        name: UAT_LEARNER_NAME,
        firstName: 'ZZ',
        lastName: 'UAT Probe',
        gradeLabel: 'Grade 5',
        learnerLoginEnabled: true,
        username: UAT_USERNAME,
        password: UAT_PASSWORD,
      },
    })
    assert(res.status === 201, `expected 201, got ${res.status} (${res.body?.message})`)
    assert(res.body?.data?.learnerLoginEnabled === true, 'created learner does not report login enabled')
    probeLearnerId = res.body.data.id
    probeEmail = `learner.${probeLearnerId}@no-email.local`
    return `learner ${probeLearnerId}`
  })

  await check('a duplicate username is rejected with a readable 409 message', async () => {
    assert(probeLearnerId, 'probe learner was not created')
    const res = await owner.json('/api/children/children', {
      method: 'POST',
      body: {
        name: 'ZZ UAT Dupe', gradeLabel: 'Grade 5',
        learnerLoginEnabled: true, username: UAT_USERNAME, password: UAT_PASSWORD,
      },
    })
    assert(res.status === 409, `expected 409, got ${res.status}`)
    assert(/already taken/i.test(res.body?.message || ''), `message not user-readable: ${res.body?.message}`)
    return res.body.message
  })

  await check('disable then re-enable with the SAME username succeeds (the 409 trap)', async () => {
    assert(probeLearnerId, 'probe learner was not created')
    const off = await owner.json(`/api/children/children/${probeLearnerId}`, {
      method: 'PUT', body: { learnerLoginEnabled: false },
    })
    assert(off.status === 200, `disable failed (${off.status})`)
    assert(off.body?.data?.learnerLoginEnabled === false, 'still reports enabled after disable')

    const on = await owner.json(`/api/children/children/${probeLearnerId}`, {
      method: 'PUT',
      body: {
        firstName: 'ZZ', lastName: 'UAT Probe', gradeLabel: 'Grade 5',
        learnerLoginEnabled: true, username: UAT_USERNAME, password: UAT_PASSWORD,
      },
    })
    assert(on.status === 200, `re-enable failed (${on.status}): ${on.body?.message}`)
    assert(on.body?.data?.learnerLoginEnabled === true, 're-enable did not restore login')
    return 'off -> on with same username'
  })

  await check('editing an already-enabled learner without a password keeps login enabled', async () => {
    assert(probeLearnerId, 'probe learner was not created')
    const res = await owner.json(`/api/children/children/${probeLearnerId}`, {
      method: 'PUT',
      body: {
        firstName: 'ZZ', lastName: 'UAT Probe', gradeLabel: 'Grade 6',
        learnerLoginEnabled: true, username: UAT_USERNAME,
      },
    })
    assert(res.status === 200, `expected 200, got ${res.status} (${res.body?.message})`)
    assert(res.body?.data?.learnerLoginEnabled === true, 'login dropped when no password was resent')
    return 'grade changed, login intact'
  })

  // ── Phase 7 ────────────────────────────────────────────────────────────────
  console.log('\nPhase 7 — learner role gate')
  let learner = null

  await check('the probe learner can sign in', async () => {
    assert(probeEmail, 'probe learner was not created')
    learner = makeSession('learner')
    const user = await learner.login(probeEmail)
    assert(user.email === probeEmail, `signed in as ${user.email}, expected ${probeEmail}`)
    assert(user.householdId === ownerUser.householdId, 'learner resolved to a different household')
    return user.email
  })

  await check('learner is DENIED household-wide gradebook summaries', async () => {
    assert(learner, 'no learner session')
    const res = await learner.json('/api/gradebook/summaries')
    assert(res.status === 403, `expected 403, got ${res.status}`)
  })

  await check('learner is DENIED creating a course', async () => {
    const res = await learner.json('/api/subjects', {
      method: 'POST', body: { name: 'ZZ Hack', category: 'Math', childId: probeLearnerId },
    })
    assert(res.status === 403, `expected 403, got ${res.status}`)
  })

  await check('learner is DENIED archiving another learner', async () => {
    const others = await owner.json('/api/children/children?includeArchived=false')
    const victim = (others.body?.data || []).find(c => c.id !== probeLearnerId)
    if (!victim) return 'skipped — no second learner to attempt'
    const res = await learner.json(`/api/children/children/${victim.id}/archive`, { method: 'PATCH' })
    assert(res.status === 403, `expected 403, got ${res.status} — A LEARNER JUST ARCHIVED ANOTHER STUDENT`)
    return `attempt on ${victim.name} blocked`
  })

  await check('learner is DENIED reading a sibling via learnerId', async () => {
    const others = await owner.json('/api/children/children?includeArchived=false')
    const sibling = (others.body?.data || []).find(c => c.id !== probeLearnerId)
    if (!sibling) return 'skipped — no sibling to attempt'
    const res = await learner.json(`/api/badges/collection?learnerId=${encodeURIComponent(sibling.id)}`)
    assert(res.status === 403, `expected 403, got ${res.status}`)
  })

  await check('learner CAN read their own todos and quran summary', async () => {
    const todos = await learner.json('/api/todos')
    const quran = await learner.json('/api/quran/summary')
    assert(todos.status === 200, `todos expected 200, got ${todos.status}`)
    assert(quran.status === 200, `quran summary expected 200, got ${quran.status}`)
  })

  await check('learner course list is scoped to themselves', async () => {
    const res = await learner.json('/api/subjects')
    assert(res.status === 200, `expected 200, got ${res.status}`)
    const foreign = (res.body?.data || []).filter(
      s => !(s.learnerIds || [s.childId]).includes(probeLearnerId),
    )
    assert(foreign.length === 0, `saw ${foreign.length} course(s) not their own: ${foreign.slice(0, 3).map(s => s.name).join(', ')}`)
    return `${(res.body?.data || []).length} own course(s)`
  })

  await check('learner lesson list is scoped to themselves', async () => {
    const res = await learner.json('/api/plan/lessons')
    assert(res.status === 200, `expected 200, got ${res.status}`)
    const foreign = (res.body?.data || []).filter(l => l.childId !== probeLearnerId)
    assert(foreign.length === 0, `saw ${foreign.length} lesson(s) belonging to other learners`)
    return `${(res.body?.data || []).length} own lesson(s)`
  })

  await check('REGRESSION: owner is still unaffected by the gate', async () => {
    const summaries = await owner.json('/api/gradebook/summaries')
    assert(summaries.status === 200, `owner gradebook expected 200, got ${summaries.status}`)
    const subjects = await owner.json('/api/subjects')
    assert(subjects.status === 200, `owner subjects expected 200, got ${subjects.status}`)
    const learners = (await owner.json('/api/children/children?includeArchived=false')).body?.data || []
    assert(learners.length >= 1, 'owner sees no learners')
    return `${(summaries.body?.data || []).length} summaries, ${learners.length} learners visible`
  })

  // ── Blockers batch (PR #46) ────────────────────────────────────────────────
  await runBlockersBatch({ owner, learner, probeLearnerId })

  // ── cleanup ────────────────────────────────────────────────────────────────
  console.log('\nCleanup')
  await check('probe learner archived (nothing deleted)', async () => {
    if (!probeLearnerId) return 'nothing to clean up'
    await owner.json(`/api/children/children/${probeLearnerId}`, {
      method: 'PUT', body: { learnerLoginEnabled: false },
    })
    const res = await owner.json(`/api/children/children/${probeLearnerId}/archive`, { method: 'PATCH' })
    assert(res.status === 200, `archive failed (${res.status})`)
    return `${probeLearnerId} archived`
  })

  // ── summary ────────────────────────────────────────────────────────────────
  const failed = results.filter(r => !r.ok)
  console.log(`\n${'='.repeat(64)}`)
  console.log(`${results.length - failed.length}/${results.length} passed`)
  if (failed.length) {
    console.log('\nFailures:')
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`)
  }
  console.log('='.repeat(64))
  process.exit(failed.length ? 1 : 0)
}

// ── blockers batch: B1-B4 ────────────────────────────────────────────────────

const ALL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DEFAULT_SCHOOL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

// Dates are YYYY-MM-DD local calendar dates, same as the app's shift engine.
function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function addDays(s, n) { const d = parseDate(s); d.setDate(d.getDate() + n); return fmtDate(d) }
function utcToday() { return new Date().toISOString().slice(0, 10) } // Render runs in UTC

function isSchoolDay(date, schoolDays, breaks) {
  if (!schoolDays.includes(ALL_DAYS[parseDate(date).getDay()])) return false
  return !breaks.some(b => date >= b.startDate && date <= b.endDate)
}
/** The nth school day strictly after `date` (n >= 1). */
function nthSchoolDayAfter(date, n, schoolDays, breaks) {
  let cur = date
  for (let found = 0; found < n;) {
    cur = addDays(cur, 1)
    if (isSchoolDay(cur, schoolDays, breaks)) found++
  }
  return cur
}
/** The nth school day on or after `date` (n >= 0). */
function nthSchoolDayFrom(date, n, schoolDays, breaks) {
  let cur = date
  while (!isSchoolDay(cur, schoolDays, breaks)) cur = addDays(cur, 1)
  return n === 0 ? cur : nthSchoolDayAfter(cur, n, schoolDays, breaks)
}

async function runBlockersBatch({ owner, learner, probeLearnerId }) {
  const created = { courseId: null, lessonIds: [], sessionId: null }
  const lessonById = {}

  async function createLesson(title, dueDate, extra = {}) {
    const res = await owner.json('/api/plan/lessons', {
      method: 'POST',
      body: { childId: probeLearnerId, subjectId: created.courseId, title, dueDate, estimatedDuration: '30min', ...extra },
    })
    assert(res.status === 201, `creating lesson "${title}" failed (${res.status}): ${res.body?.message}`)
    created.lessonIds.push(res.body.data.id)
    lessonById[title] = res.body.data.id
    return res.body.data.id
  }
  async function probeLessonDates() {
    const res = await owner.json(`/api/plan/lessons?childIds=${encodeURIComponent(probeLearnerId)}`)
    assert(res.status === 200, `reading probe lessons failed (${res.status})`)
    return Object.fromEntries((res.body?.data || []).map(l => [l.id, l.dueDate]))
  }
  function swap(moves) { return moves.map(m => ({ id: m.id, from: m.to, to: m.from })) }
  function asMoves(moves) { return moves.map(m => ({ id: m.id, from: m.from, to: m.to })) }

  if (!probeLearnerId) {
    await check('B1-B4 setup', async () => { throw new Error('probe learner was not created — skipping blockers batch') })
    return
  }

  // ── B1 — Quick Start with an open session ────────────────────────────────
  console.log('\nB1 — Quick Start: open sessions are surfaced, not a dead end')

  await check('a course with a recurring weekly time can be created for the probe learner', async () => {
    const res = await owner.json('/api/subjects', {
      method: 'POST',
      body: {
        name: 'ZZ UAT Course', category: 'Math', learnerIds: [probeLearnerId],
        recurringSchedule: [{ daysOfWeek: ALL_DAYS, startTime: '10:15', endTime: '11:00' }],
      },
    })
    assert(res.status === 201 || res.status === 200, `expected 201, got ${res.status} (${res.body?.message})`)
    created.courseId = res.body.data.id
    const block = (res.body.data.recurringSchedule || [])[0]
    assert(block && block.startTime === '10:15', 'recurring schedule did not round-trip')
    return created.courseId
  })

  await check('a paused session is what /sessions/active returns (the Dashboard reads this)', async () => {
    assert(created.courseId, 'no probe course')
    const make = await owner.json('/api/learning-time/sessions', {
      method: 'POST', body: { learnerId: probeLearnerId, timeChannelType: 'stopwatch', subjectId: created.courseId },
    })
    assert(make.status === 201, `create failed (${make.status}): ${make.body?.message}`)
    created.sessionId = make.body.data.id
    for (const action of ['start', 'pause']) {
      const t = await owner.json(`/api/learning-time/sessions/${created.sessionId}`, { method: 'PATCH', body: { action } })
      assert(t.status === 200, `${action} failed (${t.status}): ${t.body?.message}`)
    }
    const active = await owner.json(`/api/learning-time/sessions/active?learnerId=${encodeURIComponent(probeLearnerId)}`)
    assert(active.body?.data?.id === created.sessionId, 'active session is not the paused one')
    assert(active.body.data.status === 'paused', `expected paused, got ${active.body.data.status}`)
    assert(active.body.data.subjectId === created.courseId, 'active session lost its course')
    return 'paused session found'
  })

  await check('starting another session while one is open fails with a readable reason (shown to the user now)', async () => {
    const res = await owner.json('/api/learning-time/sessions', {
      method: 'POST', body: { learnerId: probeLearnerId, timeChannelType: 'stopwatch', subjectId: created.courseId },
    })
    assert(res.status === 400, `expected 400, got ${res.status}`)
    assert(/already has an active/i.test(res.body?.message || ''), `unexpected message: ${res.body?.message}`)
    return res.body.message
  })

  await check('Resume (the new Dashboard button) moves the session back to running', async () => {
    assert(created.sessionId, 'no session')
    const res = await owner.json(`/api/learning-time/sessions/${created.sessionId}`, { method: 'PATCH', body: { action: 'resume' } })
    assert(res.status === 200 && res.body?.data?.status === 'running', `resume failed (${res.status}): ${res.body?.message}`)
  })

  await check('ending and finishing the session frees Quick Start again', async () => {
    assert(created.sessionId, 'no session')
    for (const body of [{ action: 'end' }, { action: 'finalize', outcome: 'complete' }]) {
      const t = await owner.json(`/api/learning-time/sessions/${created.sessionId}`, { method: 'PATCH', body })
      assert(t.status === 200, `${body.action} failed (${t.status}): ${t.body?.message}`)
    }
    const active = await owner.json(`/api/learning-time/sessions/active?learnerId=${encodeURIComponent(probeLearnerId)}`)
    assert(active.body?.data === null, 'a session is still open')
    return 'no open session'
  })

  // ── shared calendar context for B2/B3 ─────────────────────────────────────
  const profile = await owner.json('/api/household/profile')
  const schoolDays = (profile.body?.data?.schoolDays || []).length ? profile.body.data.schoolDays : DEFAULT_SCHOOL_DAYS
  const activeRes = await owner.json('/api/school-years/active')
  const year = activeRes.body?.data || null
  const originalBreaks = year ? JSON.parse(JSON.stringify(year.breaks || [])) : []

  // Work on dates 3+ weeks out so nothing collides with "today".
  const d0 = nthSchoolDayFrom(addDays(utcToday(), 21), 0, schoolDays, originalBreaks)
  const dPrev = nthSchoolDayAfter(addDays(d0, -10), 1, schoolDays, originalBreaks) // a school day before d0
  const d1 = nthSchoolDayAfter(d0, 1, schoolDays, originalBreaks)

  // ── B2 — shift lessons ───────────────────────────────────────────────────
  console.log('\nB2 — Shift lessons by N school days (probe learner only)')

  await check('fixture lessons created around the shift date', async () => {
    assert(created.courseId, 'no probe course')
    assert(dPrev < d0, `fixture date math is off (${dPrev} !< ${d0})`)
    await createLesson('ZZ before', dPrev)
    await createLesson('ZZ A', d0)
    await createLesson('ZZ B', d0)
    await createLesson('ZZ C', d1)
    await createLesson('ZZ done', d0, { status: 'completed' })
    return `school days ${schoolDays.length}/wk, shift date ${d0}`
  })

  let shiftMoves = []
  await check('preview moves only not-started lessons on/after the date, by school days, without changing anything', async () => {
    const res = await owner.json('/api/plan/lessons/shift/preview', {
      method: 'POST', body: { mode: 'shift', fromDate: d0, schoolDays: 1, learnerIds: [probeLearnerId] },
    })
    assert(res.status === 200, `preview failed (${res.status}): ${res.body?.message}`)
    const moves = res.body.data.moves
    const ids = moves.map(m => m.id).sort()
    const expectedIds = [lessonById['ZZ A'], lessonById['ZZ B'], lessonById['ZZ C']].sort()
    assert(JSON.stringify(ids) === JSON.stringify(expectedIds), `moved ${ids.length} lessons, expected A/B/C only`)
    assert(moves.every(m => m.learnerId === probeLearnerId), 'preview included another learner')
    const to = Object.fromEntries(moves.map(m => [m.id, m.to.dueDate]))
    const next1 = nthSchoolDayAfter(d0, 1, schoolDays, originalBreaks)
    const next2 = nthSchoolDayAfter(d0, 2, schoolDays, originalBreaks)
    assert(to[lessonById['ZZ A']] === next1 && to[lessonById['ZZ B']] === next1, `A/B should land on ${next1}`)
    assert(to[lessonById['ZZ C']] === next2, `C should land on ${next2}, got ${to[lessonById['ZZ C']]}`)
    const dates = await probeLessonDates()
    assert(dates[lessonById['ZZ A']] === d0, 'preview changed data')
    shiftMoves = moves
    return `${d0} -> ${next1}, ${d1} -> ${next2}`
  })

  await check('apply moves exactly the previewed lessons; completed and earlier lessons stay put', async () => {
    assert(shiftMoves.length, 'no preview')
    const res = await owner.json('/api/plan/lessons/shift/apply', { method: 'POST', body: { moves: asMoves(shiftMoves) } })
    assert(res.status === 200 && res.body.data.applied === 3, `expected 3 applied, got ${JSON.stringify(res.body?.data)}`)
    const dates = await probeLessonDates()
    for (const m of shiftMoves) assert(dates[m.id] === m.to.dueDate, `${m.id} not at ${m.to.dueDate}`)
    assert(dates[lessonById['ZZ done']] === d0, 'completed lesson moved')
    assert(dates[lessonById['ZZ before']] === dPrev, 'earlier lesson moved')
    return '3 moved'
  })

  await check('re-applying a stale preview skips instead of overwriting', async () => {
    const res = await owner.json('/api/plan/lessons/shift/apply', { method: 'POST', body: { moves: asMoves(shiftMoves) } })
    assert(res.status === 200, `apply failed (${res.status})`)
    assert(res.body.data.applied === 0 && res.body.data.skipped.length === 3, `expected 0 applied / 3 skipped, got ${JSON.stringify(res.body.data)}`)
  })

  await check('Undo restores every original date', async () => {
    const res = await owner.json('/api/plan/lessons/shift/apply', { method: 'POST', body: { moves: swap(shiftMoves) } })
    assert(res.status === 200 && res.body.data.applied === 3, `undo applied ${res.body?.data?.applied}`)
    const dates = await probeLessonDates()
    for (const m of shiftMoves) assert(dates[m.id] === m.from.dueDate, `${m.id} not restored to ${m.from.dueDate}`)
  })

  await check('invalid shift requests are rejected (0 days, bad date)', async () => {
    const zero = await owner.json('/api/plan/lessons/shift/preview', { method: 'POST', body: { mode: 'shift', fromDate: d0, schoolDays: 0 } })
    const bad = await owner.json('/api/plan/lessons/shift/preview', { method: 'POST', body: { mode: 'shift', fromDate: '2026-13-01', schoolDays: 1 } })
    assert(zero.status === 400 && bad.status === 400, `expected 400/400, got ${zero.status}/${bad.status}`)
  })

  await check('a learner account is DENIED preview and apply', async () => {
    if (!learner) return 'skipped — no learner session'
    const p = await learner.json('/api/plan/lessons/shift/preview', { method: 'POST', body: { mode: 'shift', fromDate: d0, schoolDays: 1 } })
    const a = await learner.json('/api/plan/lessons/shift/apply', { method: 'POST', body: { moves: [] } })
    assert(p.status === 403 && a.status === 403, `expected 403/403, got ${p.status}/${a.status}`)
  })

  // ── B3 — breaks ──────────────────────────────────────────────────────────
  console.log('\nB3 — School breaks and moving lessons out of them')
  // Breaks must sit inside the active school year (which on dev may be a past year),
  // so B3 uses its own dates ~4 weeks after the year starts.
  const b0 = year ? nthSchoolDayFrom(addDays(year.startDate, 28), 0, schoolDays, originalBreaks) : null
  const b1 = b0 ? nthSchoolDayAfter(b0, 1, schoolDays, originalBreaks) : null
  try {
    await check('break fixture lessons created inside the active school year', async () => {
      if (!year) return 'skipped — no active school year on dev'
      assert(b1 <= year.endDate, `school year ${year.startDate}..${year.endDate} is too short for the fixture`)
      await createLesson('ZZ brk before', nthSchoolDayAfter(addDays(b0, -10), 1, schoolDays, originalBreaks))
      await createLesson('ZZ brk A', b0)
      await createLesson('ZZ brk B', b0)
      await createLesson('ZZ brk C', b1)
      await createLesson('ZZ brk done', b0, { status: 'completed' })
      return `year ${year.startDate}..${year.endDate}, break days ${b0}..${b1}`
    })

    await check('invalid breaks are rejected and nothing is saved', async () => {
      if (!year) return 'skipped — no active school year on dev'
      const backwards = await owner.json(`/api/school-years/${year.id}`, {
        method: 'PUT', body: { breaks: [...originalBreaks, { id: 'zz_bad', name: 'ZZ Bad', startDate: b1, endDate: b0 }] },
      })
      const outside = await owner.json(`/api/school-years/${year.id}`, {
        method: 'PUT', body: { breaks: [...originalBreaks, { id: 'zz_out', name: 'ZZ Out', startDate: addDays(year.endDate, 5), endDate: addDays(year.endDate, 6) }] },
      })
      assert(backwards.status === 400 && outside.status === 400, `expected 400/400, got ${backwards.status}/${outside.status}`)
      const after = await owner.json('/api/school-years/active')
      assert((after.body?.data?.breaks || []).length === originalBreaks.length, 'an invalid break was saved')
      return outside.body?.message
    })

    let breakMoves = []
    await check('adding a break, then break-mode preview moves the probe lessons after it', async () => {
      if (!year) return 'skipped — no active school year on dev'
      assert(lessonById['ZZ brk A'], 'break fixture lessons missing')
      const uatBreak = { id: `break_zz_uat_${Date.now()}`, name: 'ZZ UAT Break', startDate: b0, endDate: b1 }
      const saved = await owner.json(`/api/school-years/${year.id}`, { method: 'PUT', body: { breaks: [...originalBreaks, uatBreak] } })
      assert(saved.status === 200, `saving break failed (${saved.status}): ${saved.body?.message}`)

      const res = await owner.json('/api/plan/lessons/shift/preview', {
        method: 'POST', body: { mode: 'break', breakId: uatBreak.id, learnerIds: [probeLearnerId] },
      })
      assert(res.status === 200, `break preview failed (${res.status}): ${res.body?.message}`)
      const withBreak = [...originalBreaks, uatBreak]
      // Ordinal remap: b0 is school day #0 from the break start, b1 is #1. (Later probe
      // lessons, e.g. B2's, slide too — that is the intended "everything after shifts" rule.)
      const firstAfter = nthSchoolDayFrom(b0, 0, schoolDays, withBreak)
      const secondAfter = nthSchoolDayFrom(b0, 1, schoolDays, withBreak)
      const to = Object.fromEntries(res.body.data.moves.map(m => [m.id, m.to.dueDate]))
      assert(to[lessonById['ZZ brk A']] === firstAfter && to[lessonById['ZZ brk B']] === firstAfter, `A/B should land on ${firstAfter}, got ${to[lessonById['ZZ brk A']]}`)
      assert(to[lessonById['ZZ brk C']] === secondAfter, `C should land on ${secondAfter}, got ${to[lessonById['ZZ brk C']]}`)
      assert(!(lessonById['ZZ brk done'] in to) && !(lessonById['ZZ brk before'] in to), 'completed/earlier lesson included')
      breakMoves = res.body.data.moves
      return `break ${b0}..${b1}: lessons -> ${firstAfter}, ${secondAfter}`
    })

    await check('applying the break move clears the break days; Undo restores them', async () => {
      if (!breakMoves.length) return 'skipped — no break preview'
      const apply = await owner.json('/api/plan/lessons/shift/apply', { method: 'POST', body: { moves: asMoves(breakMoves) } })
      assert(apply.status === 200 && apply.body.data.applied === breakMoves.length, `applied ${apply.body?.data?.applied}/${breakMoves.length}`)
      let dates = await probeLessonDates()
      const stillInBreak = breakMoves.filter(m => dates[m.id] >= b0 && dates[m.id] <= b1)
      assert(stillInBreak.length === 0, `${stillInBreak.length} lesson(s) still inside the break`)
      const undo = await owner.json('/api/plan/lessons/shift/apply', { method: 'POST', body: { moves: swap(breakMoves) } })
      assert(undo.status === 200 && undo.body.data.applied === breakMoves.length, 'undo did not restore all')
      dates = await probeLessonDates()
      for (const m of breakMoves) assert(dates[m.id] === m.from.dueDate, `${m.id} not restored`)
      return `${breakMoves.length} moved out and back`
    })
  } finally {
    if (year) {
      await check('original school-year breaks restored exactly', async () => {
        const res = await owner.json(`/api/school-years/${year.id}`, { method: 'PUT', body: { breaks: originalBreaks } })
        assert(res.status === 200, `restore failed (${res.status}): ${res.body?.message}`)
        const after = await owner.json('/api/school-years/active')
        assert(JSON.stringify(after.body?.data?.breaks || []) === JSON.stringify(originalBreaks), 'breaks differ from the original')
        return `${originalBreaks.length} break(s)`
      })
    }
  }

  // ── B4 — course times on the schedule ────────────────────────────────────
  console.log("\nB4 — Course recurring times reach the schedule")
  await check("an untimed lesson today sits at its course's 10:15 slot; an explicitly timed one keeps its time", async () => {
    assert(created.courseId, 'no probe course')
    const today = utcToday()
    const untimed = await createLesson('ZZ today untimed', today)
    const timed = await createLesson('ZZ today timed', today, { scheduledStartTime: '13:00', scheduledEndTime: '13:30' })
    const res = await owner.json(`/api/schedule/today?childId=${encodeURIComponent(probeLearnerId)}`)
    assert(res.status === 200, `schedule failed (${res.status})`)
    const blocks = Object.fromEntries((res.body?.data?.blocks || []).map(b => [b.lesson.id, b]))
    assert(blocks[untimed], `untimed lesson not on today's schedule (server date ${res.body?.data?.date}, used ${today})`)
    assert(blocks[untimed].startTime === '10:15' && blocks[untimed].endTime === '11:00', `untimed at ${blocks[untimed].startTime}`)
    assert(blocks[timed]?.startTime === '13:00', `timed lesson at ${blocks[timed]?.startTime}`)
    return 'course slot 10:15-11:00, explicit 13:00 kept'
  })

  await check('REGRESSION: dashboard summary still loads with course times wired in', async () => {
    const res = await owner.json(`/api/dashboard/summary?childId=${encodeURIComponent(probeLearnerId)}`)
    assert(res.status === 200, `expected 200, got ${res.status}`)
  })

  // ── B cleanup ────────────────────────────────────────────────────────────
  console.log('\nB cleanup')
  await check('probe lessons deleted (only the ids this run created)', async () => {
    let deleted = 0
    for (const id of created.lessonIds) {
      const res = await owner.json(`/api/plan/lessons/${id}`, { method: 'DELETE' })
      if (res.status === 200) deleted++
    }
    assert(deleted === created.lessonIds.length, `deleted ${deleted}/${created.lessonIds.length}`)
    return `${deleted} lesson(s)`
  })
  await check('probe course archived', async () => {
    if (!created.courseId) return 'nothing to clean up'
    const res = await owner.json(`/api/subjects/${created.courseId}/archive`, { method: 'PATCH' })
    assert(res.status === 200, `archive failed (${res.status})`)
  })

  console.log('\nBrowser-only checks for PR #46 (UI is client-rendered; not provable here):')
  console.log('  - Dashboard: learner with a paused session shows "<Course> session is paused" + Resume')
  console.log('  - Settings > School year > Breaks: add / edit / remove, and the "Move them after the break?" prompt')
  console.log('  - Lesson Planner > Shift lessons: preview counts, Confirm, Undo')
  console.log('  - Dashboard Today / Calendar: untimed lesson shown at its course time')
}

main().catch(err => {
  console.error(`\nUAT aborted: ${err.message}`)
  if (VERBOSE) console.error(err)
  process.exit(1)
})
