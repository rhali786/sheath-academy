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
 *   node scripts/mark-feedback-shipped.js --pr=41 [--apply]   # only items from PR #41
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
// --pr=<n> limits the run to items from one PR (e.g. ship what's live while another PR awaits master)
const PR_FILTER = (process.argv.find((a) => a.startsWith('--pr=')) || '').slice(5);

// Items to mark shipped — action: 'ship'   (needs version; optional prNumber)
// Items to mark cancelled — action: 'cancel'
// Previous batches are in git history (v2.86.0 waves 1-5, FQ-1..3).
const KNOWN_ITEMS = [
  // PR #41 (feature/feedback-batch-20260802-open-gaps) — live on master via #42, v2.114.0
  { prefix: 'a9c34993', action: 'ship', version: '2.114.0', prNumber: 41, wave: '0802-P1', description: '12-hour AM/PM time picker on lesson form' },
  { prefix: '66087f44', action: 'ship', version: '2.114.0', prNumber: 41, wave: '0802-P2', description: 'Learning Time: start by course, not just learner' },
  { prefix: '781f32fe', action: 'ship', version: '2.114.0', prNumber: 41, wave: '0802-P3', description: 'Weekly Planner drag-to-move lessons' },
  { prefix: '62ac99a0', action: 'ship', version: '2.114.0', prNumber: 41, wave: '0802-P3', description: 'Weekly Planner integrated "By day" view across learners' },
  { prefix: '57b14788', action: 'ship', version: '2.114.0', prNumber: 41, wave: '0802-P4', description: 'Badge progress tracking' },
  { prefix: 'e6c64a05', action: 'ship', version: '2.114.0', prNumber: 41, wave: '0802-P5', description: 'Recurring weekly time per course (data + Learning Time; schedule wiring still open)' },
  // PR #43 (fix/feedback-wave1-20260928) — merged to dev, v2.116.0
  { prefix: 'ec67f864', action: 'ship', version: '2.116.0', prNumber: 43, wave: '0928-W1', description: 'Learning Time added to Planbook nav (item 1)' },
  { prefix: 'bdaa53a4', action: 'ship', version: '2.116.0', prNumber: 43, wave: '0928-W1', description: 'Course edit dialog scrolls (item 6)' },
  { prefix: 'f5b49b97', action: 'ship', version: '2.116.0', prNumber: 43, wave: '0928-W1', description: 'Course edit dialog scrolls — screenshot (item 16)' },
  { prefix: 'e41b3d34', action: 'ship', version: '2.116.0', prNumber: 43, wave: '0928-W1', description: 'Platform badges checkbox now filters (item 15)' },
  { prefix: '04a1beb3', action: 'ship', version: '2.116.0', prNumber: 43, wave: '0928-W1', description: '"Overdue" in lesson status filter (item 25)' },
  { prefix: '7f96d574', action: 'ship', version: '2.116.0', prNumber: 43, wave: '0928-W2', description: 'Gradebook shows all enrolled courses (item 14)' },
  { prefix: '38c77fc2', action: 'ship', version: '2.116.0', prNumber: 43, wave: '0928-W2', description: 'Gradebook missing courses (item 23; grade-per-lesson half still open)' },
  { prefix: '52f1ac5b', action: 'ship', version: '2.116.0', prNumber: 43, wave: '0928-W2', description: 'Learner login enable works (item 5)' },
  { prefix: '9e850827', action: 'ship', version: '2.116.0', prNumber: 43, wave: '0928-W2', description: 'Learner accounts gated by role policy (item 11)' },
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

    const items = PR_FILTER ? KNOWN_ITEMS.filter((i) => String(i.prNumber) === PR_FILTER) : KNOWN_ITEMS;
    for (const item of items) {
      const row = rows.find((r) => r.id.startsWith(item.prefix));
      if (row) {
        matched.push({ ...item, row });
      } else {
        unmatched.push(item);
      }
    }

    // Print matched results
    console.log('='.repeat(72));
    console.log(`MATCHED (${matched.length} of ${items.length} known items):`);
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
      for (const m of toShip) console.log(`  ${m.row.id.slice(0, 8)}  v${m.version}  PR #${m.prNumber ?? '-'}  (${m.description})`);
      console.log("Re-run with --apply to write.\n");
    } else {
      const now = new Date();
      if (toShip.length > 0) {
        await sql.begin(async (tx) => {
          for (const m of toShip) {
            await tx`
              UPDATE user_feedback
              SET
                status           = 'shipped',
                version_resolved = ${m.version},
                pr_number        = ${m.prNumber ?? null},
                resolved_at      = ${now}
              WHERE id = ${m.row.id}
            `;
          }
        });
        console.log(`SHIPPED — ${toShip.length} row(s), resolved_at = ${now.toISOString()}:`);
        for (const m of toShip) console.log(`  ${m.row.id}  v${m.version}  (${m.description})`);
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
