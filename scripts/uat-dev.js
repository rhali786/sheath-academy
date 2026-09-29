#!/usr/bin/env node
/**
 * Automated UAT against the deployed dev site (dev.sheathacademy.com).
 *
 * Exercises the Wave 1-2 feedback batch (PR #43, phases 0-7) against a REAL
 * database and a REAL session — the half that Jest cannot cover, because the
 * repository layer is mocked in unit tests and the DB-backed tests skip without a
 * reachable DATABASE_URL.
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
 *     afterwards. It never deletes anything.
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

    const before = await owner.json(`/api/badges/collection?learnerId=${encodeURIComponent(first.id)}`)
    assert(before.status === 200, `collection read failed (${before.status})`)
    const baseline = (before.body?.data || []).length

    const original = await owner.json('/api/badges/settings')
    const wasEnabled = original.body?.data?.platformBadgesEnabled !== false

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

main().catch(err => {
  console.error(`\nUAT aborted: ${err.message}`)
  if (VERBOSE) console.error(err)
  process.exit(1)
})
