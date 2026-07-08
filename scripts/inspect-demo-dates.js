// Read-only inspection of demo-DB date staleness. Prints, per household, the
// active school year window, and the min/max/today-relative spread of lessons,
// attendance, learning-time sessions, and quran sessions. No writes.
//
//   node -r dotenv/config scripts/inspect-demo-dates.js dotenv_config_path=.env.local
const postgres = require('postgres')

const url = process.env.DATABASE_URL
if (!url) { console.error('DATABASE_URL not set'); process.exit(1) }

// Guard: never point this at prod.
if (/sheath_academy|oregon-postgres/i.test(url) || !/sacad|virginia-postgres/i.test(url)) {
  console.error('REFUSING TO RUN: DATABASE_URL does not look like the dev DB (sacad/virginia).')
  console.error('  host preview:', url.replace(/:[^:@/]+@/, ':***@'))
  process.exit(1)
}

const sql = postgres(url)
const TODAY = new Date().toISOString().slice(0, 10)

;(async () => {
  console.log('TODAY =', TODAY)
  const households = await sql`SELECT id, name FROM households ORDER BY name`
  for (const h of households) {
    console.log('\n=== Household:', h.name, `(${h.id}) ===`)

    const years = await sql`
      SELECT id, name, start_date, end_date, is_active, required_days, required_hours
      FROM school_years WHERE household_id = ${h.id} ORDER BY start_date`
    for (const y of years) {
      const contains = y.start_date <= TODAY && TODAY <= y.end_date
      console.log(`  school_year: ${y.name} [${y.start_date} → ${y.end_date}]`,
        `active=${y.is_active} reqDays=${y.required_days} reqHours=${y.required_hours}`,
        contains ? '  <-- CONTAINS TODAY' : '')
    }

    const [les] = await sql`
      SELECT count(*)::int n, min(due_date) mn, max(due_date) mx,
             count(*) FILTER (WHERE due_date = ${TODAY})::int due_today
      FROM lesson_tasks WHERE household_id = ${h.id} AND due_date IS NOT NULL`
    console.log(`  lessons: n=${les.n} due_date [${les.mn} → ${les.mx}] dueToday=${les.due_today}`)

    const [att] = await sql`
      SELECT count(*)::int n, min(attendance_date) mn, max(attendance_date) mx,
             count(*) FILTER (WHERE status='present' AND voided_at IS NULL)::int present
      FROM attendance_events WHERE household_id = ${h.id}`
    console.log(`  attendance: n=${att.n} [${att.mn} → ${att.mx}] present=${att.present}`)

    const [lts] = await sql`
      SELECT count(*)::int n, min(started_at) mn, max(ended_at) mx,
             count(*) FILTER (WHERE status='finalized')::int finalized
      FROM learning_time_sessions WHERE household_id = ${h.id}`
    console.log(`  learning_time: n=${lts.n} started[min]=${lts.mn} ended[max]=${lts.mx} finalized=${lts.finalized}`)

    const [qur] = await sql`
      SELECT count(*)::int n, min(session_date) mn, max(session_date) mx
      FROM quran_sessions WHERE household_id = ${h.id}`
    console.log(`  quran: n=${qur.n} [${qur.mn} → ${qur.mx}]`)
  }
  await sql.end()
})().catch(e => { console.error(e); process.exit(1) })
