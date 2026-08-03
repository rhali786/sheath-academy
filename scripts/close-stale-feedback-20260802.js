#!/usr/bin/env node
'use strict';

/**
 * close-stale-feedback-20260802.js
 *
 * Closes out the stale/already-resolved rows identified in
 * docs/20260802-feedback-batch-prod-pull-plan.md (Wave 0 + Wave 5 "already
 * shipped" items, and Wave 7 "pure praise, no action" items). All 17
 * "shipped" ids were verified present on origin/master before running this.
 * Reads DATABASE_URL_PROD from .env.local.
 *
 * Usage:
 *   node scripts/close-stale-feedback-20260802.js           # dry-run (no writes)
 *   node scripts/close-stale-feedback-20260802.js --apply   # write to prod DB
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
const VERSION = '2.110.1';

// Verified present on origin/master (see docs/20260802-feedback-batch-prod-pull-plan.md Wave 0/5).
const SHIPPED = [
  { prefix: '4aef1f48', description: 'Subjects/courses disappearing from Settings (dedup fix)' },
  { prefix: '16ced0c0', description: 'Courses missing from Settings but present in Gradebook' },
  { prefix: 'be863bc6', description: 'Duplicate course after re-add' },
  { prefix: '894f8e3b', description: 'No save-changes button on Settings tabs' },
  { prefix: '3c782254', description: 'No save-changes button on Settings tabs (dup report)' },
  { prefix: '59a1624d', description: 'Learner edit form re-entry / no password reveal / not saving' },
  { prefix: '634196cb', description: 'Cannot change display name under magic-link login' },
  { prefix: 'd4e5652b', description: 'Unclear how to add a badge' },
  { prefix: 'a783e356', description: 'Empty compliance ruleset dropdown / no info tooltips' },
  { prefix: 'a11521dc', description: 'Mark compliance deadlines complete' },
  { prefix: '3b8b891b', description: 'Change start/end time for a class' },
  { prefix: '4ead6503', description: 'List courses with time lengths on Learning Time' },
  { prefix: '45d25364', description: 'Inline popup edit for Today\'s Schedule' },
  { prefix: '13adfec8', description: 'Allow screenshots on feedback form' },
  { prefix: '9e831885', description: 'List scheduled assignments / assign grades inline' },
  { prefix: '3d92d773', description: 'Link badge to gradebook evidence (found already built)' },
  { prefix: '92717f94', description: 'Lesson-edit time fields missing (confirmed present on master; stale report)' },
];

// Pure praise, no actionable ask — closed with no code change.
const NO_ACTION = [
  { prefix: '473cc681', description: 'Portfolio evidence-adding works well — praise, no action' },
  { prefix: '9aed3009', description: 'Messages working great — praise, no action' },
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
    const noAction = matchAll(NO_ACTION);

    console.log('='.repeat(72));
    console.log(`SHIPPED (${shipped.matched.length} of ${SHIPPED.length} matched):`);
    console.log('='.repeat(72));
    for (const m of shipped.matched) {
      console.log(`  ${m.row.id}  [${m.row.status} -> shipped]  ${m.description}`);
    }
    for (const u of shipped.unmatched) {
      console.log(`  NOT FOUND (or not submitted/reviewed): ${u.prefix} | ${u.description}`);
    }

    console.log('\n' + '='.repeat(72));
    console.log(`NO ACTION / CANCELLED (${noAction.matched.length} of ${NO_ACTION.length} matched):`);
    console.log('='.repeat(72));
    for (const m of noAction.matched) {
      console.log(`  ${m.row.id}  [${m.row.status} -> cancelled]  ${m.description}`);
    }
    for (const u of noAction.unmatched) {
      console.log(`  NOT FOUND (or not submitted/reviewed): ${u.prefix} | ${u.description}`);
    }

    console.log('\n' + '='.repeat(72));
    if (!APPLY) {
      console.log(
        `DRY RUN — ${shipped.matched.length} row(s) would be marked shipped (version_resolved=${VERSION}), ` +
          `${noAction.matched.length} row(s) would be marked cancelled. Re-run with --apply to write.`,
      );
      return;
    }

    const now = new Date();
    if (shipped.matched.length > 0) {
      const ids = shipped.matched.map((m) => m.row.id);
      await sql`
        UPDATE user_feedback
        SET status = 'shipped', version_resolved = ${VERSION}, resolved_at = ${now}
        WHERE id = ANY(${sql.array(ids)})
      `;
      console.log(`SHIPPED — updated ${ids.length} row(s).`);
    }
    if (noAction.matched.length > 0) {
      const ids = noAction.matched.map((m) => m.row.id);
      await sql`
        UPDATE user_feedback
        SET status = 'cancelled', recommendation = 'Positive feedback, no actionable request — closed with no code change.'
        WHERE id = ANY(${sql.array(ids)})
      `;
      console.log(`CANCELLED (no action) — updated ${ids.length} row(s).`);
    }
    console.log(`\nDone — ${shipped.matched.length + noAction.matched.length} row(s) updated.`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('Script failed:', err.message);
  process.exit(1);
});
