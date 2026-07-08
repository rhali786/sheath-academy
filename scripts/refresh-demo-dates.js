// Refresh the demo DB's dates so the dashboard renders against "today".
//
// The demo seeder writes fixed absolute dates; as real time advances they go
// stale (no lessons due today, learning-time chart empty, the active school
// year no longer contains today, compliance can't compute). This script patches
// the EXISTING rows forward — it never inserts data.
//
// Idempotent by construction:
//   - School year: the active current-year window is SET relative to today
//     (activate the already-begun year, extend its end to today+45, backfill
//     required_days/hours). Re-running recomputes the same absolute target.
//   - Distribution tables (lessons / attendance / quran / learning-time): every
//     date column is shifted by `delta = today - max(attendance_date)` for that
//     household. After a run max(attendance_date) == today, so a same-day rerun
//     computes delta = 0 (no compounding); a next-day rerun advances by 1 day.
//
// Run:  node -r dotenv/config scripts/refresh-demo-dates.js dotenv_config_path=.env.local
//       (add --dry to preview without writing)
const postgres = require('postgres')

const DRY = process.argv.includes('--dry')
const url = process.env.DATABASE_URL
if (!url) { console.error('DATABASE_URL not set'); process.exit(1) }

// Guard: only ever touch the dev DB (sacad / virginia). Refuse prod outright.
if (/sheath_academy|oregon-postgres/i.test(url) || !/sacad|virginia-postgres/i.test(url)) {
  console.error('REFUSING TO RUN: DATABASE_URL does not look like the dev DB (sacad/virginia).')
  console.error('  host preview:', url.replace(/:[^:@/]+@/, ':***@'))
  process.exit(1)
}

// "Today" in the app's timezone (America/New_York), as YYYY-MM-DD, so the DB's
// own timezone can't shift us across a day boundary.
const TODAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date())

const REQUIRED_DAYS = 180
const REQUIRED_HOURS = 900
const END_LEAD_DAYS = 45 // keep the active year open at least this far past today

const sql = postgres(url)

async function fixSchoolYear(h) {
  // Choose the year that has already begun (start_date <= today) with the latest
  // start — that's the household's "current" year. Activate it, deactivate the rest.
  const candidates = await sql`
    SELECT id, name, start_date, end_date, is_active
    FROM school_years
    WHERE household_id = ${h.id} AND start_date <= ${TODAY}::date
    ORDER BY start_date DESC`
  if (candidates.length === 0) {
    console.log(`  school_year: no year started on/before ${TODAY} — skipping`)
    return
  }
  const current = candidates[0]

  if (DRY) {
    console.log(`  school_year: would activate "${current.name}" (${current.id}), ` +
      `extend end→>=${TODAY}+${END_LEAD_DAYS}d, backfill required_days/hours`)
    return
  }

  // Single active year for the household.
  await sql`UPDATE school_years SET is_active = false, updated_at = now()
            WHERE household_id = ${h.id} AND id <> ${current.id} AND is_active = true`
  await sql`
    UPDATE school_years SET
      is_active = true,
      end_date = GREATEST(end_date, ${TODAY}::date + ${END_LEAD_DAYS}::int),
      required_days = COALESCE(required_days, ${REQUIRED_DAYS}),
      required_hours = COALESCE(required_hours, ${REQUIRED_HOURS}),
      updated_at = now()
    WHERE id = ${current.id}`
  const [row] = await sql`SELECT name, start_date, end_date, required_days FROM school_years WHERE id = ${current.id}`
  console.log(`  school_year: active "${row.name}" [${row.start_date.toISOString().slice(0,10)} → ` +
    `${row.end_date.toISOString().slice(0,10)}] required_days=${row.required_days}`)
}

async function ensureDeadline(h) {
  // Give the active school year one upcoming compliance deadline so the dashboard
  // card's "Next deadline" block renders. Keyed by a fixed id per household →
  // idempotent: re-runs refresh the due date (~38 days out) rather than duplicate.
  const [sy] = await sql`SELECT id FROM school_years WHERE household_id = ${h.id} AND is_active = true LIMIT 1`
  if (!sy) { console.log('  deadline: no active school year — skipping'); return }
  const id = `demo_deadline_${h.id}`
  if (DRY) { console.log(`  deadline: would upsert ${id} due ${TODAY}+38d`); return }
  await sql`
    INSERT INTO compliance_deadlines (id, household_id, school_year_id, label, due_date, is_completed, requirement_type, created_at, updated_at)
    VALUES (${id}, ${h.id}, ${sy.id}, 'Notarized declaration of intent', ${TODAY}::date + 38, false, 'declaration', now(), now())
    ON CONFLICT (id) DO UPDATE SET
      school_year_id = EXCLUDED.school_year_id,
      due_date = EXCLUDED.due_date,
      is_completed = false,
      updated_at = now()`
  const [d] = await sql`SELECT due_date FROM compliance_deadlines WHERE id = ${id}`
  console.log(`  deadline: "Notarized declaration of intent" due ${d.due_date.toISOString().slice(0,10)}`)
}

async function shiftDistributions(h) {
  // delta (integer days) = today - max(attendance_date). Stable anchor: the last
  // seeded attendance day represents the seed's "today".
  const [{ d: delta }] = await sql`
    SELECT (${TODAY}::date - MAX(attendance_date))::int AS d
    FROM attendance_events WHERE household_id = ${h.id}`
  if (delta === null) { console.log('  distributions: no attendance anchor — skipping'); return }
  if (delta === 0) { console.log('  distributions: already current (delta=0)'); return }
  if (DRY) { console.log(`  distributions: would shift by ${delta} days`); return }

  const iv = sql`(${delta}::int * interval '1 day')`
  const les = await sql`UPDATE lesson_tasks SET
      due_date = due_date + ${delta}::int,
      planned_start_date = planned_start_date + ${delta}::int,
      completed_at = completed_at + ${iv},
      skipped_at = skipped_at + ${iv},
      updated_at = now()
    WHERE household_id = ${h.id}`
  const att = await sql`UPDATE attendance_events SET
      attendance_date = attendance_date + ${delta}::int,
      occurred_at = occurred_at + ${iv},
      updated_at = now()
    WHERE household_id = ${h.id}`
  const qur = await sql`UPDATE quran_sessions SET
      session_date = session_date + ${delta}::int, updated_at = now()
    WHERE household_id = ${h.id}`
  const lts = await sql`UPDATE learning_time_sessions SET
      started_at = started_at + ${iv},
      ended_at = ended_at + ${iv},
      paused_at = paused_at + ${iv},
      scheduled_start = scheduled_start + ${iv},
      scheduled_end = scheduled_end + ${iv},
      updated_at = now()
    WHERE household_id = ${h.id}`
  console.log(`  distributions: shifted +${delta}d — lessons=${les.count} attendance=${att.count} quran=${qur.count} sessions=${lts.count}`)
}

;(async () => {
  console.log(`${DRY ? '[DRY RUN] ' : ''}TODAY = ${TODAY}`)
  const households = await sql`
    SELECT DISTINCT h.id, h.name FROM households h
    JOIN attendance_events a ON a.household_id = h.id
    ORDER BY h.name`
  for (const h of households) {
    console.log(`\n=== ${h.name} (${h.id}) ===`)
    await fixSchoolYear(h)
    await shiftDistributions(h)
    await ensureDeadline(h)
  }
  await sql.end()
  console.log(`\n${DRY ? '[DRY RUN complete — no writes]' : 'Done.'}`)
})().catch(e => { console.error(e); process.exit(1) })
