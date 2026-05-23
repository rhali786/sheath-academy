-- One-time data wipe. Run once before db:seed:demo.
-- FK-safe order: children before parents.
-- This is NOT a drizzle migration — run directly via psql:
--   psql $DATABASE_URL < db/wipe_app_data.sql
TRUNCATE
  portfolio_evidence,
  lesson_tasks,
  attendance_events,
  quran_sessions,
  subjects,
  school_years,
  household_settings,
  user_settings,
  learners,
  product_validation_responses,
  households,
  users
CASCADE;
