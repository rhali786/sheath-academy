#!/usr/bin/env node
'use strict';

/**
 * mark-feedback-shipped.js
 *
 * Finds feedback items associated with shipped waves 1-5 and promotes them
 * to status='shipped'. Reads DATABASE_URL_PROD from .env.local.
 *
 * Usage:
 *   node scripts/mark-feedback-shipped.js           # dry-run (no writes)
 *   node scripts/mark-feedback-shipped.js --apply   # write to prod DB
 */

const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

// Load .env.local into process.env
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
    // .env.local missing — rely on environment already being set
  }
}

loadEnv();

const connStr = process.env.DATABASE_URL_PROD;
if (!connStr) {
  console.error('ERROR: DATABASE_URL_PROD is not set in .env.local or the environment.');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');
const VERSION = '2.86.0';

// Items to mark shipped — action: 'ship'
// Items to mark cancelled — action: 'cancel'
const KNOWN_ITEMS = [
  // Wave 1a — subject list refetch after subject mutations
  { prefix: '50774221', action: 'ship', wave: '1a', description: 'Subject list refetch after mutation (1/2)' },
  { prefix: 'fcee6fd0', action: 'ship', wave: '1a', description: 'Subject list refetch after mutation (2/2)' },
  // Wave 1a follow-up — user confirmation that the fix worked
  { prefix: 'dddb6466', action: 'ship', wave: '1a', description: 'Follow-up: subject list now showing correctly' },
  // Wave 1a retraction — user said "please ignore my last feedback"
  { prefix: 'd883f50c', action: 'cancel', wave: '1a', description: 'Retraction: user asked to ignore previous feedback' },
  // Wave 1b — Generate lessons → Save to plan
  { prefix: 'e534c6cc', action: 'ship', wave: '1b', description: 'Generate lessons → Save to plan' },
  // Wave 2a — Quran session-type label clarity
  { prefix: '80f04cd0', action: 'ship', wave: '2a', description: 'Quran session-type label clarity' },
  // Wave 2b — Lesson generation pacing/cadence
  { prefix: '3c4cc9a2', action: 'ship', wave: '2b', description: 'Lesson generation pacing/cadence' },
  // Wave 3 — Subject → resource linking
  { prefix: '23cd6909', action: 'ship', wave: '3',  description: 'Subject → resource linking' },
  // Wave 4a — Attendance alert clears after logging
  { prefix: '9937be68', action: 'ship', wave: '4a', description: 'Attendance alert clears after logging' },
  // Wave 4b — Clickable setup link on dashboard
  { prefix: '9bb8370e', action: 'ship', wave: '4b', description: 'Clickable setup link on dashboard' },
  // Wave 5 — Learning Time Screen (phases 1-5 done; phase 6 e2e was a pre-existing env issue)
  { prefix: '46a51bee', action: 'ship', wave: '5',  description: 'Learning Time screen' },
  // Lesson quick-actions — Phase 1: date terminology clarity
  { prefix: 'e3729b25', action: 'ship', wave: 'QA-1', description: 'Difference between start date and planned date' },
  // Lesson quick-actions — Phase 2: Available-from inline edit
  { prefix: '42af5ab9', action: 'ship', wave: 'QA-2', description: 'Cannot edit planned date in lesson inline edit' },
  // Lesson quick-actions — Phase 3: mark-done icon on lessons page
  { prefix: 'b67114eb', action: 'ship', wave: 'QA-3', description: 'No way to mark a lesson complete from lessons page' },
  // Lesson quick-actions — Phase 4: dashboard edit button (addresses "change times for classes")
  { prefix: 'a47b444e', action: 'ship', wave: 'QA-4', description: 'Not sure how to change times for classes on dashboard' },
  // Growth wave — feature briefs built out across layer1/layer2/layer3-db (commits 6/27–6/30)
  { prefix: '78ec6a48', action: 'ship', wave: 'Growth-Compliance', description: 'Compliance system brief — deadline/submission CRUD + ruleset config' },
  { prefix: 'c71a4161', action: 'ship', wave: 'Growth-Badges',     description: 'Badge system brief — award lifecycle, evidence link, custom badge authoring' },
  { prefix: '1032a087', action: 'ship', wave: 'Growth-Gradebook',  description: 'Gradebook brief — score CRUD, grading scales, aggregation rules, GPA' },
  { prefix: '418c2940', action: 'ship', wave: 'Growth-Planner',    description: 'Lesson Planner v2 brief — lesson steps CRUD + author UI (grid/reschedule partial)' },
  // Feedback Queue (2026-07-06) — task-1-bugs
  { prefix: 'cb15ba12', action: 'ship', wave: 'FQ-1', description: 'Evidence subject dropdown missing course for secondary-enrolled learner' },
  { prefix: '713d0753', action: 'ship', wave: 'FQ-1', description: 'Generated lesson due dates ignored household school days' },
  // Feedback Queue (2026-07-06) — task-2-ux
  { prefix: 'c75d361b', action: 'ship', wave: 'FQ-2', description: 'Save-to-plan hidden until lessons generated' },
  { prefix: '36f30694', action: 'ship', wave: 'FQ-2', description: 'Scheduled Start/End time read as a recurring schedule' },
  { prefix: 'ba88751d', action: 'ship', wave: 'FQ-2', description: 'Records Readiness tiles missing current-week scope label' },
  // Feedback Queue (2026-07-06) — task-3-resources
  { prefix: '2bc4d916', action: 'ship', wave: 'FQ-3', description: 'No way to start lesson generation from a chosen chapter/page' },
  { prefix: 'adfe3188', action: 'ship', wave: 'FQ-3', description: 'No way to choose which weekdays a generated course is taught' },
  { prefix: 'bb573f78', action: 'ship', wave: 'FQ-3', description: 'No way to link a resource to an enrolled course' },
  { prefix: '3a73264e', action: 'ship', wave: 'FQ-3', description: 'Resource form had no enrolled-course dropdown' },
];

async function main() {
  const sql = postgres(connStr, { ssl: 'require', max: 1 });

  try {
    // Pull ALL user_feedback rows — the table is small enough for a full scan
    const rows = await sql`
      SELECT id, status, user_email, page_path, message, created_at, version_resolved, resolved_at
      FROM user_feedback
      ORDER BY created_at DESC
    `;

    console.log(`\nFetched ${rows.length} total feedback rows from prod.\n`);

    // Match each known item against DB rows by 8-char prefix
    const matched = [];
    const unmatched = [];

    for (const item of KNOWN_ITEMS) {
      const row = rows.find((r) => r.id.startsWith(item.prefix));
      if (row) {
        matched.push({ ...item, row });
      } else {
        unmatched.push(item);
      }
    }

    // Print matched results
    console.log('='.repeat(72));
    console.log(`MATCHED (${matched.length} of ${KNOWN_ITEMS.length} known items):`);
    console.log('='.repeat(72));
    for (const m of matched) {
      const alreadyShipped = m.row.status === 'shipped';
      const tag = alreadyShipped ? '[already shipped]' : '[will ship]';
      console.log(`\nWave ${m.wave}  ${tag}`);
      console.log(`  Description : ${m.description}`);
      console.log(`  ID          : ${m.row.id}`);
      console.log(`  Status now  : ${m.row.status}`);
      console.log(`  User email  : ${m.row.user_email}`);
      console.log(`  Page        : ${m.row.page_path}`);
      const msg = (m.row.message || '').replace(/\n/g, ' ');
      console.log(`  Message     : ${msg.slice(0, 80)}${msg.length > 80 ? '…' : ''}`);
    }

    if (unmatched.length > 0) {
      console.log('\n' + '='.repeat(72));
      console.log(`NOT FOUND IN PROD (${unmatched.length}):`);
      console.log('='.repeat(72));
      for (const u of unmatched) {
        console.log(`  Wave ${u.wave} | prefix ${u.prefix} | ${u.description}`);
      }
    }

    const toShip   = matched.filter((m) => m.action === 'ship'   && m.row.status !== 'shipped');
    const toCancel = matched.filter((m) => m.action === 'cancel' && m.row.status !== 'cancelled');

    console.log('\n' + '='.repeat(72));
    if (!APPLY) {
      console.log(`DRY RUN — ${toShip.length} row(s) would be marked shipped, ${toCancel.length} cancelled.`);
      console.log(`  shipped version_resolved = ${VERSION}`);
      console.log("Re-run with --apply to write.\n");
    } else {
      const now = new Date();
      if (toShip.length > 0) {
        const ids = toShip.map((m) => m.row.id);
        await sql`
          UPDATE user_feedback
          SET
            status           = 'shipped',
            version_resolved = ${VERSION},
            resolved_at      = ${now}
          WHERE id = ANY(${sql.array(ids)})
        `;
        console.log(`SHIPPED — ${ids.length} row(s):`);
        for (const m of toShip) console.log(`  ${m.row.id}  (${m.description})`);
        console.log(`  version_resolved = ${VERSION}, resolved_at = ${now.toISOString()}`);
      }
      if (toCancel.length > 0) {
        const ids = toCancel.map((m) => m.row.id);
        await sql`
          UPDATE user_feedback
          SET status = 'cancelled'
          WHERE id = ANY(${sql.array(ids)})
        `;
        console.log(`\nCANCELLED — ${ids.length} row(s):`);
        for (const m of toCancel) console.log(`  ${m.row.id}  (${m.description})`);
      }
      if (toShip.length === 0 && toCancel.length === 0) {
        console.log('Nothing to update — all matched items are already in their target status.\n');
      } else {
        console.log();
      }
    }

    // Print any other non-submitted, non-shipped rows for awareness
    const otherPending = rows.filter(
      (r) =>
        r.status !== 'shipped' &&
        r.status !== 'submitted' &&
        !matched.some((m) => m.row.id === r.id),
    );
    if (otherPending.length > 0) {
      console.log('='.repeat(72));
      console.log(`FYI — ${otherPending.length} other non-submitted/non-shipped row(s) in prod not in this script's scope:`);
      for (const r of otherPending) {
        const msg = (r.message || '').replace(/\n/g, ' ');
        console.log(`  [${r.status}] ${r.id} | ${r.page_path} | ${msg.slice(0, 60)}${msg.length > 60 ? '…' : ''}`);
      }
      console.log();
    }
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('Script failed:', err.message);
  process.exit(1);
});
