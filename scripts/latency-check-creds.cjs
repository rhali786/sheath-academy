#!/usr/bin/env node
/**
 * Latency harness for sheath-academy.onrender.com.
 * Logs in via credentials (email/username + password) instead of dev bypass.
 *
 * Usage:
 *   node scripts/latency-check-creds.cjs
 *   RUN_LABEL=rhali786-run node scripts/latency-check-creds.cjs
 *
 * Credentials can be overridden via env:
 *   CRED_IDENTIFIER=rhali786 CRED_PASSWORD=12345678 node scripts/latency-check-creds.cjs
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE       = 'https://sheath-academy.onrender.com'
const IDENTIFIER = process.env.CRED_IDENTIFIER || 'rhali786'
const PASSWORD   = process.env.CRED_PASSWORD   || '12345678'
const OUT_DIR    = path.join(__dirname, 'latency-results')

const PAGES = [
  { name: 'Dashboard',   path: '/' },
  { name: 'Calendar',    path: '/plan/schedule' },
  { name: 'Planner',     path: '/plan' },
  { name: 'Courses',     path: '/lessons' },
  { name: 'Attendance',  path: '/attendance' },
  { name: 'Grades',      path: '/growth' },
  { name: 'Reports',     path: '/records' },
  { name: 'People',      path: '/settings?tab=children' },
  { name: 'Resources',   path: '/resources' },
  { name: 'Quran',       path: '/quran' },
  { name: 'Compliance',  path: '/settings?tab=records-compliance' },
  { name: 'Settings',    path: '/settings' },
  { name: 'Admin',       path: '/admin/metrics' },
  { name: 'About',       path: '/about' },
]

function pad(s, n)  { return String(s).padStart(n) }
function rpad(s, n) { return String(s).padEnd(n) }

async function login(page) {
  console.log(`Logging in as "${IDENTIFIER}"...`)
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 })

  // The login page defaults to the Password tab — fill in credentials directly.
  // If for some reason the magic-link tab is active first, click Password tab.
  const passwordTab = page.getByRole('button', { name: /^password$/i })
  if (await passwordTab.isVisible()) {
    await passwordTab.click()
  }

  await page.locator('#cred-identifier').waitFor({ state: 'visible', timeout: 10000 })
  await page.locator('#cred-identifier').fill(IDENTIFIER)
  await page.locator('#cred-password').fill(PASSWORD)
  await page.getByRole('button', { name: /^sign in$/i }).click()

  // Wait for navigation away from /login (or timeout after 15 s)
  await page.waitForTimeout(5000)
  const url = page.url()
  console.log(`  URL after submit: ${url}`)

  if (!url.includes('/login')) {
    console.log('Logged in.\n')
    return
  }

  // Still on login — check for error alert
  const alertVisible = await page.locator('[role="alert"]').isVisible().catch(() => false)
  if (alertVisible) {
    const alertText = await page.locator('[role="alert"]').innerText().catch(() => '')
    throw new Error(`Credentials rejected — login page says: "${alertText}"`)
  }

  // No visible error but still on /login — try navigating home to see if session stuck
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 })
  if (page.url().includes('/login')) {
    throw new Error('Login appeared to succeed but session did not persist (redirected back to login).')
  }
  console.log('Logged in.\n')
}

async function measurePage(page, def) {
  await page.goto(`${BASE}${def.path}`, { waitUntil: 'networkidle', timeout: 40000 })

  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0]
    const apiCalls = performance.getEntriesByType('resource')
      .filter(r => r.name.includes('/api/'))
      .map(r => ({
        path:  (() => { try { return new URL(r.name).pathname } catch { return r.name } })(),
        ttfb:  Math.round(r.responseStart - r.startTime),
        total: Math.round(r.duration),
      }))
      .filter(r => r.total > 0)
      .sort((a, b) => b.ttfb - a.ttfb)

    return {
      ttfb:             Math.round(nav.responseStart - nav.requestStart),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
      load:             Math.round(nav.loadEventEnd - nav.startTime),
      apiCalls,
    }
  })
}

async function run() {
  const label = process.env.RUN_LABEL || 'rhali786-run'
  console.log(`=== Latency check — label: ${label} ===\n`)

  const browser = await chromium.launch({ headless: true })
  const ctx     = await browser.newContext()
  const page    = await ctx.newPage()

  await login(page)

  const results = []
  console.log(rpad('Page', 14), pad('TTFB', 8), pad('DCL', 8), pad('Load', 8), '  APIs (worst TTFB)')
  console.log('-'.repeat(70))

  for (const def of PAGES) {
    let timing
    try {
      timing = await measurePage(page, def)
    } catch (e) {
      console.error(`  FAILED ${def.name}: ${e.message}`)
      timing = { ttfb: -1, domContentLoaded: -1, load: -1, apiCalls: [] }
    }
    results.push({ name: def.name, path: def.path, ...timing })

    const worstApi = timing.apiCalls[0]
    const apiStr   = worstApi ? `${worstApi.path} (${worstApi.ttfb}ms)` : '—'
    console.log(
      rpad(def.name, 14),
      pad(timing.ttfb + 'ms', 8),
      pad(timing.domContentLoaded + 'ms', 8),
      pad(timing.load + 'ms', 8),
      ' ', apiStr,
    )
  }

  await browser.close()

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })
  const outFile = path.join(OUT_DIR, `${label}.json`)
  fs.writeFileSync(outFile, JSON.stringify({ runAt: new Date().toISOString(), label, pages: results }, null, 2))
  console.log(`\nSaved → ${outFile}`)
}

run().catch(e => { console.error(e); process.exit(1) })
