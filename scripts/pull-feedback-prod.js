#!/usr/bin/env node
'use strict';

/**
 * pull-feedback-prod.js
 *
 * Read-only pull of all rows from the production `user_feedback` table.
 * Reads DATABASE_URL_PROD from .env.local — never writes.
 *
 * Any row with an attached screenshot is saved to disk under
 * feedback-screenshots/ (gitignored) as <id>.<ext>, extension derived from
 * screenshot_mime, so they can be opened/viewed while reasoning about feedback.
 *
 * Usage:
 *   node scripts/pull-feedback-prod.js                  # grouped-by-status summary
 *   node scripts/pull-feedback-prod.js --status=submitted
 *   node scripts/pull-feedback-prod.js --json            # raw JSON to stdout (screenshot bytes omitted; still saved to disk)
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

const JSON_OUTPUT = process.argv.includes('--json');
const statusArg = process.argv.find((a) => a.startsWith('--status='));
const STATUS_FILTER = statusArg ? statusArg.slice('--status='.length) : null;

const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'feedback-screenshots');

const MIME_TO_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function extForMime(mime) {
  if (!mime) return 'bin';
  return MIME_TO_EXT[mime.toLowerCase()] || mime.split('/')[1] || 'bin';
}

async function main() {
  const sql = postgres(connStr, { ssl: 'require', max: 1 });

  try {
    // Pull ALL user_feedback rows — the table is small enough for a full scan.
    // screenshot bytea is included so images can be saved to disk for review.
    const rows = await sql`
      SELECT id, status, user_email, page_path, sentiment, message, created_at,
             feature_area, feedback_type, risk_level, confidence, recommendation,
             duplicate_of_feedback_id, admin_approved_at, pr_number, preview_url,
             version_resolved, resolved_at, screenshot, screenshot_mime
      FROM user_feedback
      ${STATUS_FILTER ? sql`WHERE status = ${STATUS_FILTER}` : sql``}
      ORDER BY created_at DESC
    `;

    const withScreenshot = rows.filter((r) => r.screenshot);
    const screenshotPaths = new Map();
    if (withScreenshot.length > 0) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
      for (const r of withScreenshot) {
        const ext = extForMime(r.screenshot_mime);
        const filePath = path.join(SCREENSHOT_DIR, `${r.id}.${ext}`);
        fs.writeFileSync(filePath, r.screenshot);
        screenshotPaths.set(r.id, filePath);
      }
    }

    if (JSON_OUTPUT) {
      const jsonRows = rows.map((r) => {
        const { screenshot, ...rest } = r;
        return { ...rest, screenshotPath: screenshotPaths.get(r.id) || null };
      });
      console.log(JSON.stringify(jsonRows, null, 2));
      if (withScreenshot.length > 0) {
        console.error(`\nSaved ${withScreenshot.length} screenshot(s) to ${SCREENSHOT_DIR}`);
      }
      return;
    }

    console.log(`\nFetched ${rows.length} feedback row(s) from prod${STATUS_FILTER ? ` (status=${STATUS_FILTER})` : ''}.`);
    if (withScreenshot.length > 0) {
      console.log(`Saved ${withScreenshot.length} screenshot(s) to ${SCREENSHOT_DIR}\n`);
    } else {
      console.log();
    }

    const byStatus = new Map();
    for (const row of rows) {
      const list = byStatus.get(row.status) || [];
      list.push(row);
      byStatus.set(row.status, list);
    }

    for (const [status, list] of [...byStatus.entries()].sort((a, b) => b[1].length - a[1].length)) {
      console.log('='.repeat(72));
      console.log(`${status.toUpperCase()} (${list.length})`);
      console.log('='.repeat(72));
      for (const r of list) {
        const msg = (r.message || '').replace(/\n/g, ' ');
        console.log(`\n  ${r.id}`);
        console.log(`    created     : ${r.created_at.toISOString()}`);
        console.log(`    page        : ${r.page_path}`);
        console.log(`    sentiment   : ${r.sentiment}`);
        console.log(`    user        : ${r.user_email}`);
        if (r.feature_area) console.log(`    classify    : ${r.feature_area} / ${r.feedback_type} / risk=${r.risk_level} / conf=${r.confidence}`);
        console.log(`    message     : ${msg.slice(0, 100)}${msg.length > 100 ? '…' : ''}`);
        if (screenshotPaths.has(r.id)) console.log(`    screenshot  : ${screenshotPaths.get(r.id)}`);
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
