#!/usr/bin/env node
/**
 * Latency harness for sheath-academy.onrender.com.
 * Logs in via dev bypass, navigates every nav page, captures TTFB + load + API calls.
 *
 * Usage:
 *   node scripts/latency-check.cjs                    # saves as baseline.json
 *   RUN_LABEL=after-fix node scripts/latency-check.cjs # saves as after-fix.json
 *
 * When both baseline.json and after-fix.json exist, prints a side-by-side comparison.
 */
const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE = 'https://sheath-academy.onrender.com'
const TOKEN = process.env.BYPASS_TOKEN || 'dev2026'
const OUT_DIR = path.join(__dirname, 'latency-results')

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

function pad(s, n) { return String(s).padStart(n) }
function rpad(s, n) { return String(s).padEnd(n) }
function sign(n) { return n > 0 ? `+${n}` : String(n) }

async function login(page) {
  console.log('Logging in...')
  await page.goto(`${BASE}/login`)

  const input = page.locator('input[aria-label="Dev bypass token"]')
  await input.waitFor({ state: 'visible', timeout: 10000 })
  await input.fill(TOKEN)
  await page.getByRole('button', { name: /^go$/i }).click()

  // Wait a few seconds then check state
  await page.waitForTimeout(4000)
  const url = page.url()
  console.log(`  URL after submit: ${url}`)

  if (!url.includes('/login')) {
    console.log('Logged in.\n')
    return
  }

  // Still on login — check for error message
  const errorVisible = await page.locator('[role="alert"]').isVisible().catch(() => false)
  if (errorVisible) {
    const errorText = await page.locator('[role="alert"]').innerText()
    throw new Error(`Bypass auth rejected — server says: "${errorText}". Check DEV_BYPASS_SECRET on Render.`)
  }

  // No error shown — auth may have succeeded but session not sticking; try navigating
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 })
  if (page.url().includes('/login')) {
    throw new Error(`Login succeeded but session did not persist (redirected back to login). Check AUTH_SECRET on Render.`)
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
        path: (() => { try { return new URL(r.name).pathname } catch { return r.name } })(),
        ttfb: Math.round(r.responseStart - r.startTime),
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
  const label = process.env.RUN_LABEL || 'baseline'
  console.log(`=== Latency check — label: ${label} ===\n`)

  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

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
    const apiStr = worstApi ? `${worstApi.path} (${worstApi.ttfb}ms)` : '—'
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

  // Comparison
  const baselineFile = path.join(OUT_DIR, 'baseline.json')
  const afterFile    = path.join(OUT_DIR, 'after-fix.json')
  if (fs.existsSync(baselineFile) && fs.existsSync(afterFile)) {
    const before = JSON.parse(fs.readFileSync(baselineFile, 'utf8'))
    const after  = JSON.parse(fs.readFileSync(afterFile, 'utf8'))
    console.log('\n=== COMPARISON: baseline → after-fix ===')
    console.log(rpad('Page', 14), pad('TTFB Δ', 10), pad('Load Δ', 10), '  TTFB: before → after')
    console.log('-'.repeat(60))
    for (const b of before.pages) {
      const a = after.pages.find(p => p.name === b.name)
      if (!a) continue
      const dt = a.ttfb - b.ttfb
      const dl = a.load - b.load
      console.log(
        rpad(b.name, 14),
        pad(sign(dt) + 'ms', 10),
        pad(sign(dl) + 'ms', 10),
        ` ${b.ttfb}ms → ${a.ttfb}ms`,
      )
    }
    const avgBefore = Math.round(before.pages.reduce((s, p) => s + p.ttfb, 0) / before.pages.length)
    const avgAfter  = Math.round(after.pages.reduce((s, p) => s + p.ttfb, 0) / after.pages.length)
    console.log('-'.repeat(60))
    console.log(rpad('AVG TTFB', 14), pad(sign(avgAfter - avgBefore) + 'ms', 10), '          ', `${avgBefore}ms → ${avgAfter}ms`)
  }
}

run().catch(e => { console.error(e); process.exit(1) })
