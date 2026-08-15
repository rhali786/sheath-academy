#!/usr/bin/env node
'use strict';

/**
 * update-feedback-20260803.js
 *
 * Two updates against prod `user_feedback`:
 *  1. `6f7a6af3` (Lesson Planner UX rework) -> 'shipped'. Resolved by prior
 *     work (G8/G9, already on master/prod for weeks) per the design-spike
 *     at docs/20260803-lesson-planner-rework-design-spike.md — not new code
 *     from this session.
 *  2. The 5 remaining open-gap items just implemented in PR #41 -> 'in_pr'
 *     (NOT 'shipped' — PR #41 is not merged/deployed yet).
 *
 * Reads DATABASE_URL_PROD from .env.local.
 *
 * Usage:
 *   node scripts/update-feedback-20260803.js           # dry-run (no writes)
 *   node scripts/update-feedback-20260803.js --apply   # write to prod DB
 */

const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '..', '.env.local');
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // rely on env already set
  }
}

loadEnv();

const connStr = process.env.DATABASE_URL_PROD;
if (!connStr) {
  console.error('ERROR: DATABASE_URL_PROD is not set in .env.local or the environment.');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');
const VERSION = '2.114.0';
const PR_NUMBER = 41;

const SHIPPED = [
  {
    prefix: '6f7a6af3',
    recommendation:
      'Resolved by prior work (G8 lesson-planner rework + G9 calendar-tab addition), already on master/prod. ' +
      'See docs/20260803-lesson-planner-rework-design-spike.md for the point-by-point comparison — all 7 UX ' +
      'points and the explicit design questions are addressed; no new build was needed.',
  },
];

const IN_PR = [
  { prefix: '57b14788', description: 'Badge progress tracking + custom badge images' },
  { prefix: '781f32fe', description: 'Drag-to-move lessons on Weekly Planner' },
  { prefix: '62ac99a0', description: 'Combined multi-child daily view on Weekly Planner' },
  { prefix: 'e6c64a05', description: 'Recurring per-class schedule on courses' },
  { prefix: '66087f44', description: 'Course-first selector on Learning Time' },
  { prefix: 'a9c34993', description: '12-hour AM/PM time picker on lesson edit form' },
];

async function main() {
  const sql = postgres(connStr, { ssl: 'require', max: 1 });

  try {
    const rows = await sql`
      SELECT id, status, page_path, message
      FROM user_feedback
      WHERE status IN ('submitted', 'reviewed')
    `;

    function matchAll(items) {
      const matched = [];
      const unmatched = [];
      for (const item of items) {
        const row = rows.find((r) => r.id.startsWith(item.prefix));
        if (row) matched.push({ ...item, row });
        else unmatched.push(item);
      }
      return { matched, unmatched };
    }

    const shipped = matchAll(SHIPPED);
    const inPr = matchAll(IN_PR);

    console.log('='.repeat(72));
    console.log(`SHIPPED (${shipped.matched.length} of ${SHIPPED.length} matched):`);
    console.log('='.repeat(72));
    for (const m of shipped.matched) {
      console.log(`  ${m.row.id}  [${m.row.status} -> shipped]`);
    }
    for (const u of shipped.unmatched) {
      console.log(`  NOT FOUND (or not submitted/reviewed): ${u.prefix}`);
    }

    console.log('\n' + '='.repeat(72));
    console.log(`IN_PR (${inPr.matched.length} of ${IN_PR.length} matched, PR #${PR_NUMBER}):`);
    console.log('='.repeat(72));
    for (const m of inPr.matched) {
      console.log(`  ${m.row.id}  [${m.row.status} -> in_pr]  ${m.description}`);
    }
    for (const u of inPr.unmatched) {
      console.log(`  NOT FOUND (or not submitted/reviewed): ${u.prefix} | ${u.description}`);
    }

    console.log('\n' + '='.repeat(72));
    if (!APPLY) {
      console.log(
        `DRY RUN — ${shipped.matched.length} row(s) would be marked shipped, ` +
          `${inPr.matched.length} row(s) would be marked in_pr (prNumber=${PR_NUMBER}). Re-run with --apply to write.`,
      );
      return;
    }

    const now = new Date();
    if (shipped.matched.length > 0) {
      for (const m of shipped.matched) {
        await sql`
          UPDATE user_feedback
          SET status = 'shipped', version_resolved = ${VERSION}, resolved_at = ${now}, recommendation = ${m.recommendation}
          WHERE id = ${m.row.id}
        `;
      }
      console.log(`SHIPPED — updated ${shipped.matched.length} row(s).`);
    }
    if (inPr.matched.length > 0) {
      const ids = inPr.matched.map((m) => m.row.id);
      await sql`
        UPDATE user_feedback
        SET status = 'in_pr', pr_number = ${PR_NUMBER}
        WHERE id = ANY(${sql.array(ids)})
      `;
      console.log(`IN_PR — updated ${ids.length} row(s).`);
    }
    console.log(`\nDone — ${shipped.matched.length + inPr.matched.length} row(s) updated.`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('Script failed:', err.message);
  process.exit(1);
});
