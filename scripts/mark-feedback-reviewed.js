#!/usr/bin/env node
'use strict';

/**
 * mark-feedback-reviewed.js
 *
 * Triages the two "bigger feature" feedback items now that a code-grounded plan
 * exists (docs/bug_enhancement/20260707-feedback-bigger-features-plan.md).
 * Sets status='reviewed' and fills the null classification fields.
 * Reads DATABASE_URL_PROD from .env.local.
 *
 * Usage:
 *   node scripts/mark-feedback-reviewed.js           # dry-run (no writes)
 *   node scripts/mark-feedback-reviewed.js --apply    # write to prod DB
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
const PLAN = 'docs/bug_enhancement/20260707-feedback-bigger-features-plan.md';

// Both are large enhancements now backed by the plan above. status -> 'reviewed'.
const ITEMS = [
  {
    prefix: 'f96c36b3',
    featureArea: 'dashboard',
    feedbackType: 'enhancement',
    riskLevel: 'high',
    confidence: 'high',
    recommendation:
      'Calendar reminders (new reminders feature) + Google Calendar/Gmail sync. Planned in ' + PLAN + '. Sync phase gated on Google Cloud setup.',
  },
  {
    prefix: 'b01b66f0',
    featureArea: 'attendance',
    feedbackType: 'enhancement',
    riskLevel: 'high',
    confidence: 'high',
    recommendation:
      'Break-range entry (SchoolYear.breaks already modeled) + auto-reschedule of lessons around breaks. Planned in ' + PLAN + '. Reschedule engine is the risk-heavy part.',
  },
];

async function main() {
  const sql = postgres(connStr, { ssl: 'require', max: 1 });
  try {
    const rows = await sql`
      SELECT id, status, page_path, feature_area, feedback_type, risk_level, message
      FROM user_feedback
      WHERE status = 'submitted'
    `;

    const matched = [];
    for (const item of ITEMS) {
      const row = rows.find((r) => r.id.startsWith(item.prefix));
      if (row) matched.push({ ...item, row });
      else console.log(`  NOT FOUND (or not 'submitted'): ${item.prefix}`);
    }

    console.log('='.repeat(72));
    console.log(`MATCHED ${matched.length} of ${ITEMS.length}:`);
    for (const m of matched) {
      const msg = (m.row.message || '').replace(/\n/g, ' ').slice(0, 60);
      console.log(`\n  ${m.row.id}`);
      console.log(`    page        : ${m.row.page_path}`);
      console.log(`    status now  : ${m.row.status}  ->  reviewed`);
      console.log(`    classify    : ${m.featureArea} / ${m.feedbackType} / risk=${m.riskLevel} / conf=${m.confidence}`);
      console.log(`    message     : ${msg}…`);
    }

    console.log('\n' + '='.repeat(72));
    if (!APPLY) {
      console.log(`DRY RUN — ${matched.length} row(s) would be set to 'reviewed' with classification. Re-run with --apply.`);
      return;
    }

    for (const m of matched) {
      await sql`
        UPDATE user_feedback
        SET status = 'reviewed',
            feature_area = ${m.featureArea},
            feedback_type = ${m.feedbackType},
            risk_level = ${m.riskLevel},
            confidence = ${m.confidence},
            recommendation = ${m.recommendation}
        WHERE id = ${m.row.id}
      `;
      console.log(`  UPDATED ${m.row.id} -> reviewed`);
    }
    console.log(`\nDone — ${matched.length} row(s) updated.`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('Script failed:', err.message);
  process.exit(1);
});
